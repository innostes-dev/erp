# Security Policy

Innostes Solutions takes the security of Luxis UI seriously. We appreciate the
efforts of security researchers and the community in helping keep this project safe.

---

## Supported Versions

We release security patches for the following versions:

| Version | Supported |
|---------|-----------|
| Latest major (`1.x`) | ✅ Actively supported |
| Previous major | ⚠️ Critical fixes only (6 months after new major release) |
| Older versions | ❌ No longer supported |

We strongly recommend always using the latest version of `@luxis-ui/react`.

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub Issues, Discussions, or Pull Requests.**

Public disclosure before a fix is available puts the entire community at risk.

### How to Report

Send a detailed report to our security team:

**Email:** security@innostes-solutions.com  
**Subject line:** `[SECURITY] Luxis UI — <short description>`

### What to Include

Please provide as much of the following as possible to help us understand and
reproduce the issue:

- Type of vulnerability (e.g. XSS, prototype pollution, dependency confusion, etc.)
- The affected component, file, or package version
- Step-by-step instructions to reproduce the issue
- Proof-of-concept code or a minimal reproduction
- Potential impact — what can an attacker achieve?
- Any suggested fix or mitigation, if you have one

### Response Timeline

| Stage | Timeframe |
|-------|-----------|
| Initial acknowledgement | Within **48 hours** |
| Triage and severity assessment | Within **5 business days** |
| Fix development and internal testing | Depends on severity (see below) |
| Coordinated public disclosure | After fix is released |

**Severity-based fix timeline:**

| Severity | Target fix release |
|----------|--------------------|
| Critical | Within 7 days |
| High | Within 14 days |
| Medium | Within 30 days |
| Low | Next scheduled release |

We will keep you informed throughout the process. If you do not receive an
acknowledgement within 48 hours, please follow up at security@innostes-solutions.com.

---

## Coordinated Disclosure

We follow a coordinated disclosure process:

1. You report the vulnerability to us privately.
2. We confirm receipt within 48 hours.
3. We assess severity and develop a fix.
4. We notify you when a fix is ready and agree on a disclosure date.
5. We publish a security advisory and release the patched version.
6. You may publish your findings after the patch is publicly available.

We aim to complete this process within **90 days** for all severity levels.
If exceptional circumstances require more time, we will communicate this to you.

---

## Bug Bounty

At this time, Luxis UI does not operate a paid bug bounty program. However, we
deeply value responsible disclosure. Reporters of valid, confirmed vulnerabilities
will be:

- Credited in the GitHub Security Advisory (unless you prefer to remain anonymous)
- Mentioned in the relevant release notes
- Added to our public [SECURITY_HALL_OF_FAME.md](./SECURITY_HALL_OF_FAME.md) (opt-in)

---

## Dependency Vulnerabilities

Luxis UI relies on a small set of dependencies. If you discover a vulnerability
in one of our dependencies:

1. Check whether it has already been reported upstream.
2. If not, report it to the upstream maintainer first.
3. Let us know at security@innostes-solutions.com so we can track and patch promptly.

We run automated dependency audits on every pull request and weekly on the `main`
branch using `pnpm audit`.

---

## Out of Scope

The following are **not** considered security vulnerabilities for this project:

- Vulnerabilities in development-only dependencies (`devDependencies`)
- Issues that require physical access to a user's device
- Social engineering attacks
- Issues in browsers or environments that are no longer officially supported
- Theoretical vulnerabilities without a working proof-of-concept
- Issues already known and tracked in our public issue tracker

---

## Contact

| Purpose | Contact |
|---------|---------|
| Security vulnerabilities | security@innostes-solutions.com |
| General questions | hello@innostes-solutions.com |
| Website | https://innostes-solutions.com |

---

*This security policy applies to `@luxis-ui/react` and all packages under the Luxis UI monorepo.*  
*Maintained by [Innostes Solutions](https://innostes-solutions.com) — Copyright (c) 2026*
