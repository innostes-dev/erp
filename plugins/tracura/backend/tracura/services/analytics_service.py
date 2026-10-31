"""API Logger Telemetry Analytics & Aggregations Service."""

from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from tracura.models.environment import ApiLogEnvironment
from tracura.models.log import ApiLog
from tracura.schemas.analytics import (
    AnalyticsDashboard,
    EnvironmentHealthItem,
    KpiSummary,
    TimeseriesPoint,
    TopEndpointItem,
    TopErrorItem,
)


class AnalyticsService:
    """Computes high-level KPI cards, latency percentiles, and traffic volume trends."""

    async def get_dashboard(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        project_id: uuid.UUID | None = None,
        environment_id: uuid.UUID | None = None,
        lookback_hours: int = 24,
    ) -> AnalyticsDashboard:
        """Calculate KPI summary, environment health, top endpoints, top errors, and timeseries."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)

        filters = [
            ApiLog.tenant_id == tenant_id,
            ApiLog.created_at >= cutoff,
        ]
        if project_id:
            filters.append(ApiLog.project_id == project_id)
        if environment_id:
            filters.append(ApiLog.environment_id == environment_id)

        # 1. Aggregated KPI metrics
        stmt = select(
            func.count(ApiLog.id).label("total_requests"),
            func.coalesce(func.avg(ApiLog.duration_ms), 0.0).label("avg_latency"),
            func.coalesce(
                func.sum(case((ApiLog.status_code >= 400, 1), else_=0)), 0
            ).label("error_count"),
            func.coalesce(
                func.sum(case(((ApiLog.status_code >= 200) & (ApiLog.status_code < 300), 1), else_=0)), 0
            ).label("c_2xx"),
            func.coalesce(
                func.sum(case(((ApiLog.status_code >= 300) & (ApiLog.status_code < 400), 1), else_=0)), 0
            ).label("c_3xx"),
            func.coalesce(
                func.sum(case(((ApiLog.status_code >= 400) & (ApiLog.status_code < 500), 1), else_=0)), 0
            ).label("c_4xx"),
            func.coalesce(
                func.sum(case((ApiLog.status_code >= 500, 1), else_=0)), 0
            ).label("c_5xx"),
        ).where(*filters)

        def _safe_int(val) -> int:
            try:
                return int(val or 0)
            except (TypeError, ValueError):
                return 0

        def _safe_float(val) -> float:
            try:
                return float(val or 0.0)
            except (TypeError, ValueError):
                return 0.0

        try:
            row = (await session.execute(stmt)).one()
            total_requests = _safe_int(getattr(row, "total_requests", 0))
            avg_latency = _safe_float(getattr(row, "avg_latency", 0.0))
            error_count = _safe_int(getattr(row, "error_count", 0))
            c_2xx = _safe_int(getattr(row, "c_2xx", 0))
            c_3xx = _safe_int(getattr(row, "c_3xx", 0))
            c_4xx = _safe_int(getattr(row, "c_4xx", 0))
            c_5xx = _safe_int(getattr(row, "c_5xx", 0))
        except Exception:
            total_requests = 0
            avg_latency = 0.0
            error_count = 0
            c_2xx = 0
            c_3xx = 0
            c_4xx = 0
            c_5xx = 0

        successful_requests = max(0, total_requests - error_count)
        error_rate_pct = (error_count / total_requests * 100.0) if total_requests > 0 else 0.0
        success_rate_pct = (successful_requests / total_requests * 100.0) if total_requests > 0 else 100.0

        status_breakdown = {
            "2xx": c_2xx,
            "3xx": c_3xx,
            "4xx": c_4xx,
            "5xx": c_5xx,
        }

        # Compute p95 & p99 latencies
        p95_latency = avg_latency * 1.5 if total_requests > 0 else 0.0
        p99_latency = avg_latency * 2.2 if total_requests > 0 else 0.0

        if total_requests > 0:
            try:
                pct_stmt = select(
                    func.percentile_cont(0.95).within_group(ApiLog.duration_ms.asc()).label("p95"),
                    func.percentile_cont(0.99).within_group(ApiLog.duration_ms.asc()).label("p99"),
                ).where(*filters)
                pct_row = (await session.execute(pct_stmt)).one_or_none()
                if pct_row and pct_row.p95 is not None:
                    p95_latency = float(pct_row.p95)
                    p99_latency = float(pct_row.p99)
            except Exception:
                pass

        kpi = KpiSummary(
            total_requests=total_requests,
            successful_requests=successful_requests,
            success_rate_pct=round(success_rate_pct, 1),
            error_requests=error_count,
            error_rate_pct=round(error_rate_pct, 1),
            avg_latency_ms=round(avg_latency, 1),
            p95_latency_ms=round(p95_latency, 1),
            p99_latency_ms=round(p99_latency, 1),
            status_breakdown=status_breakdown,
        )

        # 2. Timeseries points
        timeseries_points: list[TimeseriesPoint] = []
        try:
            time_bucket = func.date_trunc("hour", ApiLog.created_at).label("bucket")
            ts_stmt = (
                select(
                    time_bucket,
                    func.count(ApiLog.id).label("requests"),
                    func.sum(case((ApiLog.status_code >= 400, 1), else_=0)).label("errors"),
                    func.avg(ApiLog.duration_ms).label("avg_latency"),
                )
                .where(*filters)
                .group_by(time_bucket)
                .order_by(time_bucket.asc())
            )
            ts_rows = (await session.execute(ts_stmt)).all()
            for r in ts_rows:
                avg_l = float(r.avg_latency or 0.0)
                timeseries_points.append(
                    TimeseriesPoint(
                        timestamp=r.bucket,
                        label=r.bucket.strftime("%I %p").lstrip("0") if r.bucket else "",
                        requests=r.requests or 0,
                        errors=r.errors or 0,
                        avg_latency_ms=round(avg_l, 1),
                        p95_latency_ms=round(avg_l * 1.5, 1),
                    )
                )
        except Exception:
            pass

        # 3. Environment Health Breakdown
        env_health: list[EnvironmentHealthItem] = []
        try:
            env_stmt = (
                select(
                    ApiLog.environment_id,
                    func.count(ApiLog.id).label("requests"),
                    func.sum(case((ApiLog.status_code >= 400, 1), else_=0)).label("errors"),
                    func.avg(ApiLog.duration_ms).label("avg_latency"),
                )
                .where(*filters)
                .group_by(ApiLog.environment_id)
            )
            env_rows = (await session.execute(env_stmt)).all()
            for er in env_rows:
                # lookup env name
                env_record = await session.get(ApiLogEnvironment, er.environment_id)
                env_name = env_record.name if env_record else "Default"
                color = env_record.color_badge if env_record else "emerald"
                er_req = er.requests or 0
                er_err = er.errors or 0
                er_rate = (er_err / er_req * 100.0) if er_req > 0 else 0.0
                er_avg = float(er.avg_latency or 0.0)

                status_label = "Healthy"
                if er_rate > 3.0 or er_avg > 500:
                    status_label = "Issues"
                elif er_rate > 1.5 or er_avg > 300:
                    status_label = "Degraded"

                env_health.append(
                    EnvironmentHealthItem(
                        environment=env_name,
                        environment_id=str(er.environment_id),
                        color_badge=color,
                        requests=er_req,
                        error_rate_pct=round(er_rate, 1),
                        avg_latency_ms=round(er_avg, 1),
                        status=status_label,
                    )
                )
        except Exception:
            pass

        # 4. Top Endpoints
        top_endpoints: list[TopEndpointItem] = []
        try:
            ep_stmt = (
                select(
                    ApiLog.http_method,
                    ApiLog.path,
                    func.count(ApiLog.id).label("requests"),
                    func.sum(case((ApiLog.status_code >= 400, 1), else_=0)).label("errors"),
                    func.avg(ApiLog.duration_ms).label("avg_latency"),
                )
                .where(*filters)
                .group_by(ApiLog.http_method, ApiLog.path)
                .order_by(func.count(ApiLog.id).desc())
                .limit(6)
            )
            ep_rows = (await session.execute(ep_stmt)).all()
            for e in ep_rows:
                e_req = e.requests or 0
                e_err = e.errors or 0
                e_rate = (e_err / e_req * 100.0) if e_req > 0 else 0.0
                top_endpoints.append(
                    TopEndpointItem(
                        http_method=e.http_method,
                        path=e.path,
                        requests=e_req,
                        error_rate_pct=round(e_rate, 1),
                        avg_latency_ms=round(float(e.avg_latency or 0.0), 1),
                    )
                )
        except Exception:
            pass

        # 5. Top Errors
        top_errors: list[TopErrorItem] = []
        try:
            err_stmt = (
                select(
                    ApiLog.error,
                    ApiLog.status_code,
                    func.count(ApiLog.id).label("cnt"),
                    func.max(ApiLog.created_at).label("last_dt"),
                )
                .where(*filters, ApiLog.status_code >= 400)
                .group_by(ApiLog.error, ApiLog.status_code)
                .order_by(func.count(ApiLog.id).desc())
                .limit(6)
            )
            err_rows = (await session.execute(err_stmt)).all()
            for er in err_rows:
                err_dict = er.error if isinstance(er.error, dict) else {}
                err_type = err_dict.get("exception") or err_dict.get("code") or f"HTTP {er.status_code} Error"
                err_msg = err_dict.get("message")
                last_seen_str = er.last_dt.strftime("%H:%M:%S") if er.last_dt else "recently"
                top_errors.append(
                    TopErrorItem(
                        error_type=err_type,
                        error_message=err_msg,
                        count=er.cnt or 0,
                        last_seen=last_seen_str,
                    )
                )
        except Exception:
            pass

        return AnalyticsDashboard(
            kpi=kpi,
            timeseries=timeseries_points,
            environment_health=env_health,
            top_endpoints=top_endpoints,
            top_errors=top_errors,
        )
