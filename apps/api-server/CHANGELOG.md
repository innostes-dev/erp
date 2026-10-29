# Innostes ERP API Changelog

All notable changes to the Innostes ERP REST API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-29

### Added
- Standardized OpenAPI 3.1 specification published at `/api-reference/openapi.json`.
- Full-suite contract tests validating every response status code across all 33 operations.
- Dedicated reference documentation and interactive request playground (`/api-reference`).
- Complete developer integration guides covering Quickstart, Authentication, Multi-Tenancy, Setup, Error Handling, Pagination, Records & Audit, Client Generation, and Environments & CORS.
- Centralised machine-readable `ErrorCode` constants across all kernel services.
- Comprehensive machine error-code catalogue, versioning policy, deprecation policy, limits, and security guides.
- Automated OpenAPI freshness check and Spectral lint quality gates wired into CI.

### Changed
- Standardised all operation IDs into canonical `<feature>_<action>` naming format.
- Unified security requirement scheme under `BearerAuth` across authentication, tenancy, and user management modules.
- Explicitly declared 401 Unauthorized, 403 Forbidden, and 422 Unprocessable Content response schemas on all protected endpoints.

### Removed
- Removed internal `timeout` query parameter from `GET /setup/status` to eliminate undocumented parameters.
