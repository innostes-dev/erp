# AI Generation Prompt — Ultimate Enterprise Auth Security


---

## OCR Extract 1

```text

CreatedAt: timestamp(‘created_at', { withTimezone: true H.notWutl() .defaurtiow(), 6
241. 5 + Gk % :

U ‘ > yi ee
### New table: ‘auth_everits* (audit. log — @ppend-only) ~ > :
245

File: “Ubs/kernet/db/sre/sch auth-events, table.ts? 2
248 “typescript e Pi . a ci
249 import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

250 ‘ > F

251 export const authEventsTable = PoTable(‘auth_events*, {_ ‘i me

252 id: * uuid(*id')primarykey().defaultRandom(), 2 sf ‘
+ 253° | usertd: uuid(‘user_id'), // nullable ~ pré-auth failures have no userId fe kg

254 tenantId: uuid('tenant_id'), : 4 »

255 |. eventType: varchar(‘event-type', { length: 64 }).notiutt(),

256 // REGISTER | LOGIN_SUCCESS | LOGIN_FATLURE |. LOGOUT

257 | // TOKEN_REFRESH | TOKEN_REUS|

258

E_DETECTED | ACCOUNT_LOCKED
OTP_FAILED | OTP_EXPIRED
| 7/ PASSWORD_RESET | PASSWORD_CHANGED

260 //SESSTON_REVOKED | ALL_SESSTONS ; te ; ;
261 ipAddress: varchar(*ip_address', { length: 45 wn,

262 userAgent: varchar(*user_agent", { length: 512 y», >
263 metadata: _jsonb( metadata‘), As,

264 createdAt: timestamp(‘created_at', { withTimezone: true }).notNull() defauttnow(),

25; ‘ : ‘ .

266. 3S ‘

267

268 ### Update’ schema registry

269 :

270 Fille: “Ubs/kerne\/db/sre/schema/index.ts*

2 :

272 ***typescript

273

export * trom. *./tenants.table!;
274

export * from ‘./users.table';
275 export & from ‘./ref;

resh-tokens.table'; ‘

376 export « fron *./otp=tokens.table';

277 export * from ‘./auth-events.table'; 3 : ‘ ‘

mas ee

279 ; ety

280 After changes: :

281 “““bash - I
at DapM db:generate && pnpm dbimigrate

paper

284

285 _

286

287

## Environment Variables
2388

= AG PATes *1ihestarnal fenntia tere tamu echane te — add these #ialde
> 3

[_,

(n1,Col1 Spaces: 2 UTF-8

LF .{} Markdown Qo


```


---

## OCR Extract 2

```text

~ Sign in

## Databa:

‘Schema

#0# Modify table: ‘users* aa ‘
safe to index.

### New table: ‘refresh_tokens” rs

File: *libs/kernel/db/src/schema/refresh-tokens. table, ts>

‘typescript i AV? aie
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { usersTable } from './users,table';

”

import { tenantsTableé } from './tenants. table's

export const refreshTokensTable = pgTable(*refresh_tokens', {
id:

userId:
tenantId:
familytd:
‘tokentiash:
userAgent:
ipAddress:
expiresat:
revokedat:
createdAt:

Mm

uuid('id') .primaryKey() defaultRandom(),

uuid(‘user_id').notNull().references(() => usersTable.id, { onDelete: ‘cascade’ }),
uuid(‘tenant_id').notNull().references(() => tenantsTable.id, { onDelete: '
uuid('family_id*) notNutt(),

scade" }),
// at rotations in one login chain share familyld
varchar('token_hash', { length: 64 }).notNull().unique(), // SHA-256 hex of raw JWT .
varchar(‘user_agent*, { length: 512 }),

varchar('ip_address', { length: 45 }), // IPv6-safe

‘timestamp(*expires_at', { withTimezone: true }).notNull(),
‘timestamp(*revoked_at', { withTimezone: true }),

‘timestamp(*created_at', { withTimezone: true }).notNull().defaultNow(),

#0 New table: ‘otp_tokens*

File: “Libs/kernel/db/src/schema/otp-tokens, table. ts*

** typescript

import { pgTable, uuid, varchar, timestamp } from ‘drizzle-orm/pg-core';
import { usersTable } from './users.table';

export const
Aidt
userId:
otpHash:
purpose:
attempts:
expiresat:
usedAt:
ApAddress:
createdat:

a

otpTokensTable.= figTable(*otp_tokens', {

uuid("id").primaryKey().defauttRandom(),,

wuid(‘user_id*) notNulL().references(() => usersTable.id, { onDelete: ‘cascade’ }),

varchar(*otp_hash', { Length: 64 }).notNull(), // SHA-256 hex of 6-digit OTP

varchar(*purpose', { Length: 32 }).notNull(), // *FORGOT_PASSWORD' | ‘EMAIL_VERIFY' -
notNulU() default (e), 1 wax 5 before invalidation

‘imestamp("expires_at*, { withTimezpne: true }).notNull(),

// 10 minutes
‘timestamp(*used_at', { withTimezone: true }),

varchar('ip_address', { length: 45 }),
‘times:

tamp(*created_at*, { withTimezone: true )-notNull().defaultNow(),

e#@ Wew table: “auth_events’ (audit Log ~ append-only)

File: *Libs/kernel/db/sre/schema/auth-events.table.ts*

\n4,Col1 Spaces: 2 UTF-8

CF .() Markdown 88 SRR ct


```


---

## OCR Extract 3

```text

© © Seneration Prompt — Ultimate Enterprise Auth Security
## Target Architecture

‘### Cookie specification hi

—Host-" prefix: browser enforces Secure + Path=/ + no Domain (highest security).

*_Secure-* prefix: browser enforces Secure (used on fefresh because Path must be */api/vi/auth').
Tokens never appear in response body, query params, or logs.
### API surface

| Method | Path | Guard | Rate Limit | Description |
\ I i |

| | : " ;
| POST | */api/vi/auth/register* | None | 5/min/IP | ‘Register, field-encrypt email, set cookies | 3
| POST | */api/vi/ayth/login® | None | 5/min/IP | Login, Progressive lockout, set cookies |
| POST | */api/vi/auth/logout* | JwtCookie | - | Revoke DB tokens, clear cookies | 2
| POST | ‘/api/vi/auth/refresh* | None | 10/min/IP | Rotate tokens, detect reuse I
| GET | */api/vi/auth/me* .| JwtCookie | - | Current user profile |
| GET | “/api/vi/auth/sessions* | IwtCookie | - | List active sessions | é
| DELETE | */api/vi/auth/sessions/:id* | JwtCookie | - | Revoke one session | “ .
| DELETE | */api/vi/auth/sessions* | JwtCookie | - | Revoke all sessions |
| POST | */api/vi/auth/forgot-password* | None | 3/3@min/IP | Send OTP email i)
| Post | */api/vi/auth/verify-otp* | Nor
| Post |

ne | 5/10min/IP | Verify OTP, return reset token | x
*/api/vi/auth/reset-password* | None | -3/10min/IP | Change Password, revoke all sessions |

## Database Schema © :
### Modify table: ‘users*

File: > \ibs/kernel/db/sre/schena/users. table.ts*

typescript

import { pgTable, uuid, varchar, integer, timestamp } from

“drizzle-orm/pg-core' ;
import { tenantsTable } from *./tenants. table’;

export const usersTable = pgTable('users', {
id:

uuid(* id*).primarykey() defaultRandom(), %
tenantId: uuid( ‘tenant_id') notNulU().references(() => tenantsTable.id, {

onDelete: ‘cascade’ }), 7
// Field-level encrypted. Never store plaintext email. ,
// Lookup uses emailtmac (HMAC-SHA256 of normalized email).
emailenc: varchar('email_enc', { length: 512 }).notult(),
emailimac:

// BES-256-GCM ciphertext, base64

varchar(*email_hmac', { Length: 64 }),notNull().unique(), // HMAC-SHA2S6 hex for lookups
PasswordHash: varchar(‘password_hash', { length: 255 }).notNull(),
failedLoginCount:

Anteger(*failed_login_count') .notNul
lockeduntil:

U() .default(e), I
‘timestamp('locked_until’, { withTimezone: true }),
enailerifiedAt:  timestamp(*email_verified_at', { withTimezone: true »,
passwordChangedat: timestamp(*password_changed_at', { withTimezone: true }),
createdat: ‘timestamp('created_at’,
updatedat:

{ withTimezone: true }).notNull().defauttNow(),
timestamp(*updated_at', { withTimezone: true )-notNull().defaultNow(),



```


---

## OCR Extract 4

```text

om seneracion Prompt — Ultimate Enterprise Auth Security
## Target Architecture Satur

‘### Token flow
Browser “NestJS API (Fastify)
I ; aay
|— POST /api/vi/auth/ login ————| } ”
| { email, password } | 1. throttle check (5 req/min/IP) $
| b : | 2. lockout check (lockedUntil column)
| | 3. DB Lookup by HMAC(email) ;
| | 4. .berypt. compare (always runs - even “for unknown email)
| oy | 5. progressive lockout on failure
| | 6. issue accessJwt (15m) + refreshIwt (7d) with jti + iss + aud
| ae “| 7. store SHA-256(refreshiwt) in refresh_tokens table
| : || 8. write LOGIN_SUCCESS to auth_events
<§$@ $a Set-Cookie: _Host-at (900s, HttpOnly, Secure, SameSite=Strict)
| | Set-Cookie: _secure-rt (6o4seds, Hittponty, Secure, Path=/api/vi/auth)
| ¥ | Body: { message: ‘ok' } + no token ever in body
| .
|

— GET /dashboard (SSR) ——————»| Next. js reads _Host-at cookie server-side ; i

|— Post /api/vi/auth/refresh —-|
(sends _Secure-rt only) | 1. verify JWT signature + iss + aud
ae | 2. SHA-256(token) + Lookup in DB "4
| 3. if already revoked + REUSE ATTACK + revoke family + audit + 401
| 4. mark old token revoked
5. issue new pair, store new hash (same familyId)

| New Set-Cookie headers

|
|
|
|

### Cookie specification

| Cookie | Prod name | Dev name | HttpOnly | Secure
| |——-- |__|
| Access token | *_Host-at* 1 *at*
| Refresh token | *_Secure-rtt hoy

| SameSite | Path | Max-Age |
|————-|——— |—___ 1
I ¢ 14 | Strict | */* | 9005 |
rt 1+ [+ | Strict | */api/visauth* | 6ease0s |

#0@ API surface

| Method | Path | Guard | Rate Limit

| Description |
|

1————|
| Post | */api/vi/auth/register* | None | 5/min/IP | Register,
V/2p4/vA/auth/Login® | None | 5/min/IP | Login, progressive lockout, set cookies |

!
PosT | “/api/v1/auth/logout* | JwtCookie | - | Revoke DB tokens, clear cookies !
POST | */api/vi/auth/refresh* | None |

field-encrypt email, set cookies i}

in/IP | Rotate tokens, detect reuse |
GET | */api/vi/auth/me* |, JwtCookie | ~ | Current user profile |
GET | */api/vi/auth/sessions* | JwtCookie | - | List active sessions |
DELETE | */api/v1/auth/sessions/:id*

| JwtCookie | -— | Revoke ane’



```


---

## OCR Extract 5

```text

Pe Ge? aes

Toh ee2: ae
_PLAN.md X : .

~_PLAN.md > @ # Al Generation Prompt — Ultimate Enterprise Auth Security : ¥
# AI Generation Prompt — Ultimate Enterprise Auth Security

## Threat Model - Every Attack Category

### Category 4: Injection & Application Attacks

### Category 5: DDoS & Resource Exhaustion
| Attack | Description | Control | :

eel Se od

o

| HTTP flood | High RPS overwhelming the server | @nestjs/throttler per-IP with burst limits |

| Slowloris | Keep connections open with slow headers | Fastify request timeout (30s); connection keep-alive timeout |

| Large payload / body bomb | Enormous request bodies | Fastify bodyLimit: 64KB (auth routes need <1KB) i]

| berypt DoS | Send 10MB password + berypt blocks event loop | 128-char max on password ‘before berypt (Zod + class-validator) |
| Memory exhaustion } Huge JSON payloads | Strict bodyLimit; JSON parse depth limit i}

| Infrastructure DDoS ‘| Volumetric L3/L4 | Cloudflare / AWS Shield (infrastructure layer — document in deployment guide) I

### Category 6: Data Security

| Attack | Description | Control |
SS) =r 1
| DB. breach — plain passwords | Attacker reads password_hash column | beryptjs cost 12

— computationally infeasible to reverse I
| DB breach — plain PII | Email addresses exposed | AES-256-GCM field encryption + HMAC lookup index |
| DB connection interception | MITM between app-and DB | ‘ssl: { rejectUnauthorized:

true }* in postgres.js connection I
| 0B credential theft | *.env* exposed | DB user has minimum Privileges (INSERT/SELECT on own tables only) |

| Log leakage | Tokens or passwords in logs | Never log request bodies on auth routes; redact sensitive fields |

| Backup exposure | Unencrypted DB dumps |..At-rest encryption at OS/storage level (d

locument in ops runbook) |
### Category 7: Infrastructure & Transport

Attack | Description | Control |

|

| x *
| TLS downgrade / BEAST | HTTP fallback | HSTS max-age=31536000 + preload;

|

|

|

|

Secure cookie flag |
Clickjacking | UI redress attack | X-Frame-Options; DENY; CSP frame-ancestors ‘none’ I
MIME sniffing | Browser executes wrong content type | X-Content-Type-Options: nosniff 1
Information leakage | Stack traces in error responses | ALlExceptionsFilter returns no internal details |
Open redirect | Attacker controls redirect after login | Validate redirect URLs against allowlist !
t

## Target Architecture


```


---

## OCR Extract 6

```text

JTH_PLAN.md > #¢ # Al Generation Prompt — Ultimate Enterprise Auth Security .
# AI Generation Prompt — Ultimate Enterprise Auth Security

## Threat Model — Every Attack Category
### Category 1: Authentication Attacks

| Attack | Description | Control | ‘ 3
er oes | | .

”
| Brute force | Repeated password guesses | Progressive lockout + per-IP rate limit | G

| Credential stuffing | Leaked credential lists | Breach check (HaveIBeenPwned k-anonymity) + anomaly detection |

| Password spraying | One password, many users | Per-IP rate limit across all login attempts |

| Timing / user enumeration | Different. response time for valid vs. invalid email | Constant-time berypt always runs;
| Weak passwords | Dictionary passwords, short Passwords | 12-char min, complexity rules, 128-char max, breach check |
| Session fixation | Reuse Pre-login session | Issue new jti on every login; rotate all tokens I

it# Category 2: Token & Session Attacks

| Attack | Description | Control |

| | [---—-----]

| XSS token theft | JS reads token from Storage | HTTP-only cookies — JS cannot access |

| CSRF | Cross-site form submits session cookie | SameSite=Strict; custom X-Tenant-ID header acts as second factor |
| Token replay | Stolen token reused | DB-backed ‘refresh token revocation; short access token TTL |

| Refresh token theft | Long-lived token Stolen | Single-use rotation; token family reuse detection |
| Token reuse (family attack) | Attacker replays old refresh token | Entire family revoked on reuse;
| JWT algorithm confusion | alg:none or RS/HS confusion | Enforce HS256 explicitly;

| JWT weak secret | Brute-force JWT signature | 256-bit+ random secret enforced by

audit logged |
never accept alg from header |
Zod schema (min 32 chars) |

### Category 3: Account Takeover

| Attack | Description | Control |
1 | |
| Password reset abuse | Mass OTP requests | 3 OTP requests per email per 3@ minutes; OTP expires in 10 min |

| OTP brute force | Guess 6-digit code | Max 5 OTP verification attempts ~ OTP invalidated |

| OTP interception | OTP in URL / logs | OTP in email body only; never in URL params; never logged |

| Email enumeration on reset | Reveal whether email exists | Uniform response: “If this email exists, a code was sent" !

¢

| Password change notification bypass | Attacker silently changes password | Email notification on every password change; all sessions

t
### Category 4: Injection & Application Attacks

Attack | Description | Control |

FEES Ss GER CO
SQL injection | Malicious SQL in inputs | Drizzle ORM parameterized queries — never raw strings |
Header injection | CRLF in headers | Fastify strips CRLF; ValidationPipe whitelists inputs |

ReDoS | Catastrophic regex backtracking | No complex regex; use simple anchored patterns |
Mass assignment | Extra fields bypass validation | ValidationPipe forbidNonWhitelisted + whitelist: true i}
Prototype pollution | _proto__ in JSON body | NestJS/class-transformer isolates DT0s to class instances |

uniform error messages |

revoked |

Email header injection | Newlines in email field | Email field validated via IsEmail + 254-char max; sanitized before use |



```
