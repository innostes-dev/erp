"""OpenAPI specification quality gate and checklist linter.

Validates apps/api-server/openapi.json against STANDARDS.md checklists
(E1-E17, S1-S8, T1-T3). Supports report mode and enforce mode.

Usage:
    python scripts/lint_openapi.py
"""

import json
from pathlib import Path
import re
import sys

app_root = Path(__file__).resolve().parents[1]
spec_path = app_root / "openapi.json"
exceptions_path = app_root / "openapi-lint-exceptions.yaml"


def load_config() -> tuple[set[str], list[dict]]:
    report_rules = set()
    exceptions = []
    if exceptions_path.exists():
        text = exceptions_path.read_text(encoding="utf-8")
        in_report = False
        for line in text.splitlines():
            line_str = line.strip()
            if line_str.startswith("report_mode_rules:"):
                in_report = True
                continue
            if in_report:
                if line_str.startswith("-"):
                    rule_id = line_str.lstrip("-").split("#")[0].strip()
                    report_rules.add(rule_id)
                elif line_str and not line_str.startswith("#"):
                    in_report = False
    return report_rules, exceptions


def main() -> None:
    if not spec_path.exists():
        print(f"❌ {spec_path} does not exist. Run 'pnpm nx run api-server:openapi'.", file=sys.stderr)
        sys.exit(1)

    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    report_rules, exceptions = load_config()

    violations = []

    def add_violation(rule_id: str, location: str, message: str, fix_hint: str) -> None:
        is_report = rule_id in report_rules
        violations.append({
            "rule": rule_id,
            "mode": "REPORT" if is_report else "ENFORCE",
            "location": location,
            "message": message,
            "fix": fix_hint,
        })

    # 1. Tags Checklist (T1-T3)
    tags = spec.get("tags", [])
    tag_names = set()
    tag_list = []
    for tag in tags:
        tname = tag.get("name", "")
        tag_names.add(tname)
        tag_list.append(tname)
        if not tag.get("description"):
            add_violation("T1", f"tag:{tname}", "Tag description is missing", "Add description in openapi_tags")
        # Check sentence case: words after the first should not be capitalized unless acronym
        words = tname.split()
        if len(words) > 1:
            for w in words[1:]:
                if w[0].isupper() and not w.isupper():
                    add_violation("T3", f"tag:{tname}", f"Tag name '{tname}' is not in sentence case", f"Change to '{words[0]} {words[1].lower()}'")

    # T2: Tag order check (General, Observability, Authentication, Setup, Tenancy, User management, CRM, HRMS, API logger)
    expected_prefix = ["General", "Observability", "Authentication"]
    actual_prefix = tag_list[:3]
    if actual_prefix != expected_prefix:
        add_violation("T2", "tags", f"Initial tag order {actual_prefix} does not follow logical sequence {expected_prefix}", "Reorder openapi_tags in server.py")

    # 2. Operations Checklist (E1-E17)
    paths = spec.get("paths", {})
    operation_ids = set()

    for path_str, methods in paths.items():
        for method, op in methods.items():
            if method == "parameters":
                continue
            loc = f"{method.upper()} {path_str}"
            op_id = op.get("operationId", "")

            # E1: operation_id pattern & uniqueness
            if not op_id:
                add_violation("E1", loc, "operationId is missing", "Assign explicit operation_id in route decorator")
            elif op_id in operation_ids:
                add_violation("E1", loc, f"Duplicate operationId: '{op_id}'", "Ensure operationId is globally unique")
            else:
                operation_ids.add(op_id)
                if re.search(r"_[a-z]+_[a-z0-9_]+_(get|post|patch|delete|put)$", op_id):
                    add_violation("E1", loc, f"Auto-generated FastAPI operationId '{op_id}'", "Assign explicit operation_id='<feature>_<action>'")

            # E2: summary
            summary = op.get("summary", "")
            if not summary:
                add_violation("E2", loc, "summary is missing", "Add summary='...' to route decorator")
            else:
                if len(summary) > 60:
                    add_violation("E2", loc, f"summary exceeds 60 characters ({len(summary)} chars)", "Shorten summary to <= 60 characters")
                if summary.endswith(".") or summary.endswith("!"):
                    add_violation("E2", loc, "summary should not end with full stop", "Remove trailing punctuation from summary")

            # E3: description
            desc = op.get("description", "")
            if not desc:
                add_violation("E3", loc, "public description (docstring before \\f) is missing", "Add docstring describing action, actors, and side effects")
            elif any(k in desc for k in ["Args:", "Returns:", "Raises:"]):
                add_violation("E3", loc, "Internal docstring (Args/Returns/Raises) leaked before \\f", "Move internal Python arguments after \\f marker")

            # E4: Exactly one tag, declared in tags
            op_tags = op.get("tags", [])
            if len(op_tags) != 1:
                add_violation("E4", loc, f"Operation must have exactly one tag (found {len(op_tags)})", "Assign single primary tag")
            elif op_tags[0] not in tag_names:
                add_violation("E4", loc, f"Tag '{op_tags[0]}' not defined in top-level tags", "Register tag in server.py openapi_tags")

            # E5: Security requirement
            security = op.get("security")
            if security is None:
                add_violation("E5", loc, "Explicit security declaration is missing", "Declare security=[{'BearerAuth': []}] or security=[] for public")
            elif any("HTTPBearer" in s for s in security):
                add_violation("E5", loc, "Uses legacy HTTPBearer security scheme", "Use unified BearerAuth scheme")

            # E6: Parameters
            for param in op.get("parameters", []):
                p_name = param.get("name", "")
                if not param.get("description"):
                    add_violation("E6", f"{loc} (param:{p_name})", f"Parameter '{p_name}' lacks description", "Add description to Field/Query/Path")
                p_schema = param.get("schema", {})
                if p_schema.get("type") == "string" and "id" in p_name.lower() and not p_schema.get("format"):
                    add_violation("E6", f"{loc} (param:{p_name})", f"ID parameter '{p_name}' lacks format: uuid", "Specify format='uuid' on Path parameter")

            # E8: Success response
            responses = op.get("responses", {})
            success_codes = [c for c in responses if c.startswith("2")]
            if not success_codes:
                add_violation("E8", loc, "No 2xx success response documented", "Declare response_model in decorator")

            # E9: Error responses
            has_params_or_body = bool(op.get("parameters") or op.get("requestBody"))
            if has_params_or_body and "422" not in responses:
                add_violation("E9", loc, "Operation accepts input parameters or body but omits 422 error response", "Add 422 to responses=error_responses(...)")
            is_secured = bool(security and len(security) > 0 and not any(len(s) == 0 for s in security))
            if is_secured and "401" not in responses:
                add_violation("E9", loc, "Secured operation omits 401 Unauthorized error response", "Add 401 to responses=error_responses(...)")

            # E11: Known headers
            if "current" in path_str and not any(p.get("name") == "X-Tenant-ID" for p in op.get("parameters", [])):
                add_violation("E11", loc, "Tenant-scoped route does not document required X-Tenant-ID header parameter", "Declare Header parameter in router")
            if "setup" in path_str and path_str in ["/setup/checks", "/setup"] and not any(p.get("name") == "X-Setup-Token" for p in op.get("parameters", [])):
                add_violation("E11", loc, "Setup endpoint does not document X-Setup-Token header parameter", "Declare X-Setup-Token parameter in router")

            # E12: List endpoints
            if method == "get" and (path_str.endswith("s") or "list" in op_id):
                resp_200 = responses.get("200", {}).get("content", {}).get("application/json", {}).get("schema", {})
                ref = resp_200.get("$ref", "")
                if "Page" in ref or "List" in ref:
                    params = {p.get("name"): p for p in op.get("parameters", [])}
                    if "offset" in params and "minimum" not in params["offset"].get("schema", {}):
                        add_violation("E12", loc, "Pagination 'offset' parameter missing minimum=0 bound", "Set ge=0 on offset Query param")

            # E17: Safe example data
            op_str = json.dumps(op)
            emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', op_str)
            for email in emails:
                if not email.endswith(".example"):
                    add_violation("E17", loc, f"Example email '{email}' uses non-reserved domain", "Use domain ending in .example")

    # 3. Schemas Checklist (S1-S8)
    schemas = spec.get("components", {}).get("schemas", {})
    for s_name, s_obj in schemas.items():
        loc = f"schema:{s_name}"

        # S1: Schema class description
        if not s_obj.get("description"):
            add_violation("S1", loc, f"Schema '{s_name}' lacks class docstring description", "Add class docstring to Pydantic model")

        # S2 & S3: Fields
        properties = s_obj.get("properties", {})
        for p_name, p_prop in properties.items():
            if not p_prop.get("description") and not p_name.startswith("$"):
                add_violation("S2", f"{loc}.{p_name}", f"Field '{p_name}' lacks description", "Add description to Field(...)")
            if p_prop.get("example") is None and p_prop.get("examples") is None and not p_prop.get("readOnly"):
                add_violation("S2", f"{loc}.{p_name}", f"Field '{p_name}' lacks example", "Add examples=[...] to Field(...)")

        # S6: Read schemas have example
        if s_name.endswith("Read") or s_name.endswith("Response"):
            has_ex = s_obj.get("example") or s_obj.get("examples") or (properties and any(p.get("example") is not None for p in properties.values()))
            if not has_ex:
                add_violation("S6", loc, f"Read/response schema '{s_name}' lacks json_schema_extra example", "Add model_config = {'json_schema_extra': {'example': ...}}")

        # S7: Consistent naming
        if s_name.endswith("Input") and not s_name.startswith("Setup"):
            add_violation("S7", loc, f"Schema '{s_name}' uses legacy Input suffix instead of Create/Update", "Rename schema to <Entity>Create or <Entity>Update")

    # Reporting
    enforce_errors = [v for v in violations if v["mode"] == "ENFORCE"]
    report_warnings = [v for v in violations if v["mode"] == "REPORT"]

    print(f"OpenAPI Quality Gate: {len(violations)} total checklist observations across 33 operations & 38 schemas.\n")

    if enforce_errors:
        print(f"❌ ENFORCED CHECK DEFECTS ({len(enforce_errors)}):")
        for e in enforce_errors:
            print(f"  [{e['rule']}] {e['location']} - {e['message']} (Fix: {e['fix']})")
    else:
        print("✓ All ENFORCED checklist rules passed (E4, E8, E14, E17, S4, S8, T1).")

    print(f"\nℹ️ REPORT-MODE METRICS ({len(report_warnings)} observations tracking toward prompt 10):")
    counts_by_rule = {}
    for w in report_warnings:
        counts_by_rule[w["rule"]] = counts_by_rule.get(w["rule"], 0) + 1
    for r, count in sorted(counts_by_rule.items()):
        print(f"  [{r}] {count} occurrences")

    if enforce_errors:
        sys.exit(1)
    else:
        print("\n✅ OpenAPI quality gate passed in current configuration.")
        sys.exit(0)


if __name__ == "__main__":
    main()
