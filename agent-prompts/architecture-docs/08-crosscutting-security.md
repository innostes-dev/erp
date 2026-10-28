# 08 – Cross-cutting concepts and security architecture (arc42 §8)

## Role

You are a principal engineer and a security architect. Document the concepts that apply across
every module. Then model the system's threats with STRIDE, the way a security review board expects.

## Read first

`STANDARDS.md`, `PROGRESS.md`, `AUDIT.md` (the threat-surface inventory and the items owned by 08),
`kernel/core/security/*`, `kernel/core/crypto/*`, `kernel/auth/*`, `kernel/user/models/*` (RBAC,
session, device, security, password history), `kernel/setup/*`, `kernel/core/http.py`,
`core/services/*`, `core/schemas/*`, `guides/backend-conventions.mdx`, and the API runbook's guides
if they exist (link to them; don't duplicate them).

## Concept pages (explanation; each links to its code, enforcement and ADR)

1. **Authentication**: credential storage (the hashing algorithm and parameters, from the code),
   access and refresh tokens (claims, signing algorithm, lifetimes, rotation), sessions and devices,
   password policy and history, the reset flow, and the setup token.
2. **Authorisation**: the RBAC model as implemented (roles, permissions, assignments and their
   scope per tenant), where checks happen today, and what isn't enforced yet (mark as a risk).
   Never describe the RBAC tables as an enforced authorisation system if no endpoint checks them.
3. **Multi-tenancy** (summary): link to the data architecture page from prompt 06; cover only the
   runtime enforcement points here.
4. **Error handling**: the service error hierarchy, the mapping to HTTP, the `ErrorResponse`, what is
   logged versus returned, and how secrets are kept out of error messages.
5. **Validation**: schema validation at the edge, versus service-level rules, versus database
   constraints.
6. **Transactions and consistency**: session scope, commit points, and concurrency behaviour (for
   example optimistic locking with `If-Match`, if used; verify).
7. **Configuration and secrets**: link to the configuration reference, and explain the layering
   (environment, `.env`, defaults).
8. **Logging and audit trail**: the difference between technical logs and the audit columns, and
   what is recorded for security events.
9. **Internationalisation and time**: UTC storage, locale handling in the API and UI (link the UI
   docs).
10. **Testing strategy**: unit, contract (API runbook), UI tests, React compatibility suites,
    fitness functions, and what runs in CI.

## Threat model (`architecture/security/threat-model.mdx`)

- **Scope and assumptions.**
- **Data flow diagrams** (Mermaid `flowchart`, D1–D7): external entities, processes, data stores,
  and **trust boundaries** (browser ↔ API, API ↔ database, API ↔ SMTP, operator ↔ CLI setup).
- **Assets**: credentials, tokens, tenant data, personal data, the setup token, secrets.
- **Threats per element, using STRIDE** (spoofing, tampering, repudiation, information
  disclosure, denial of service, elevation of privilege). Each threat has: ID (`TM-001…`),
  description, affected element, existing mitigations (with `file:line`), residual risk
  (likelihood and impact, on a stated scale) and recommended action.
- **Top risks**, fed into the risk register (prompt 10).
- **Review cadence**, and how to update the model when an architecture change happens.

Base every mitigation claim on the code, and on a test where one exists. Where you suspect a
weakness (for example missing rate limiting on login, token reuse detection, tenant isolation gaps),
write it as a threat with its residual risk. Don't fix the code in this prompt; record an `ARC-*`
finding.

## Definition of done

- The concept pages and the threat model exist, and pass A and D. Mitigations are evidenced.
- The risks are handed to prompt 10 in `PROGRESS.md`.
- The gates pass.
- Commit as `docs(arch): cross-cutting concepts and STRIDE threat model`.
- STANDARDS §7 is met.
