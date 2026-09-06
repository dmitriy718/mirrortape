# MirrorTape unified execution contract

This document combines the founder's 20-feature implementation/testing/deployment instructions with [the detailed production roadmap](PRODUCTION_READINESS_PLAN.md). Both documents apply. This contract takes precedence where the original roadmap assumed an unselected provider or managed-cloud deployment.

## Confirmed product and infrastructure choices

| Item | Decision | Verification status |
|---|---|---|
| Production domain | `mirrortape.net` | User supplied; DNS/ownership, TLS and hosting not yet verified |
| Payments | Stripe subscriptions, Checkout and Customer Portal | User selected; account configuration and financial-business approval not verified |
| First brokerage | Alpaca | User selected; commercial Connect approval and credentials not verified |
| Hosting | Existing production VPS | User supplied; OS, resources, SSH access, proxy and service configuration not provided |
| Frontend | Preserve React/TypeScript/Tailwind and MirrorTape design | Inspected in `app/` |
| Trading | Real supported stock/options copying with server risk controls | Not implemented in current project |
| Verification | Playwright with headless Chromium, desktop and mobile | Must be installed, configured and exercised |

Use Alpaca Connect/OAuth to link existing customer brokerage accounts unless the actual commercial arrangement requires a different approved architecture. Do not substitute Alpaca Broker API account opening without an explicit business decision. Keep paper/live credentials, account IDs, event streams and worker authorization separate.

`https://mirrortape.net` is the canonical origin. Serve the product at `/app` and the same-origin API at `/api` to minimize cookie/CORS complexity. Configure the approved Alpaca redirect at `/api/brokers/alpaca/callback` and Stripe webhook at `/api/webhooks/stripe`. Register these exact endpoints in provider dashboards when access is available. No API secret belongs in a Vite variable or browser bundle.

## Non-negotiable truth and safety requirements

- No fabricated social proof, scarcity, prices, performance, fills, uptime, account state, testimonials, or successful payments.
- “Saved to cloud” requires an acknowledged write to the production service. Local testing must display a truthful server/local label; browser storage alone is not cloud persistence.
- Guest access may cover exploration and a real paper workspace. It never grants live execution authority or bypasses customer eligibility, broker permissions or required consent.
- A five-second undo applies to supported application record deletions. It cannot reverse an executed trade, revoke an already accepted contract, or promise recovery from an irreversible external action.
- A missing provider configuration is an explicit unavailable state and release blocker for the dependent feature. It must never activate a simulated success path.
- Build/test success is necessary but insufficient for financial SaaS launch. Provider approval, execution reconciliation, security review, operational drills and legal/marketing gates in the roadmap remain mandatory.

## All 20 features: implementation and acceptance

| ID | Feature | Required implementation | Evidence required |
|---|---|---|---|
| F01 | Contextual onboarding tooltips | Accessible, dismissible guidance for broker linking, allocation, order states and pause/close behavior; persisted dismissal; keyboard and reduced-motion support | Chromium tests for first visit, dismiss, revisit, focus, mobile and re-enabling help |
| F02 | Five-second undo | Server-persisted pending deletion of supported watchlists/presets; undo token scoped to owner; delayed commit based on server deadline; retry and reload recovery | Undo before deadline preserves record; after deadline cannot restore falsely; reload, duplicate request and second-tab races tested |
| F03 | Transparent progress | Real workflow state machines for account/session checks, broker sync, onboarding and billing; steps advance only on completed work; expose retries and stalled steps | Delayed/rejected real API response tests verify no manufactured percentage or premature success |
| F04 | Auto-save | Debounced authenticated/guest drafts with server timestamps, revision checks, pending/failed states, navigation protection and retry; do not persist passwords, card data or secrets as drafts | Reload persistence, network failure, older-response race, conflict and recovery tests; real database write verified |
| F05 | Clear error recovery | Stable typed API errors mapped to plain explanations and permitted retry/fallback; internal diagnostics retain request IDs without secrets | Each core journey tested for expired session, unavailable provider, validation error, conflict and retry; no stack traces in UI |
| F06 | Dynamic social proof | Aggregate actual recent opted-in activity; privacy threshold and coarse time buckets; dismissible notification; hide if no qualifying evidence | Actual stored events produce correct aggregate; low counts/expired activity/opt-out suppress notification; no synthetic seed in production |
| F07 | Micro-commitment wizard | Email-first guest onboarding, followed by explicit preferences and review; validation and autosaved progress; account/broker authorization only at the appropriate stage | Back/next/reload tests preserve real drafts; duplicate completion idempotent; guest is never represented as verified |
| F08 | Scarcity/urgency | Availability based on an operationally configured real cohort/capacity policy; transactional reservation and expiration; disable badges when no actual limit/offer exists | Concurrent final-slot requests cannot oversell; expired offer and released reservation update correctly; no resetting countdown |
| F09 | Guest exploration/onboarding | Secure scoped guest session, limited persisted workspace, safe expiration/cleanup and transactional migration to an authenticated account | Separate guests cannot share records; account upgrade retains only its own data; guest cannot invoke live trading or privileged APIs |
| F10 | Smart autofill/validation | Native semantic autocomplete plus a real authorized address provider where address collection is needed; server-proxied Places requests, bounded requests, session token and manual fallback; inline validation | Keyboard/address selection/manual-entry tests; invalid input rejected server-side; provider failure recoverable; credentials never exposed; real provider acceptance separately verified |
| F11 | Honeypots | Inert hidden public-form field excluded from accessibility/normal autocomplete; checked server-side before processing; return a neutral outcome without creating records or sending email | Filled trap produces no side effects; legitimate keyboard/password-manager flow succeeds; direct API tests cannot bypass checks |
| F12 | Progressive rate limiting | Shared-store sliding windows on auth/forms/API, normalized account and trusted-network keys, escalating bounded penalties, `429` and `Retry-After`; cleanup and abuse monitoring | Concurrent requests and multiple app workers share limits; spoofed forwarding headers fail; expiry/recovery and non-enumerating auth responses tested |
| F13 | Strict CSP | Response header with self/explicit script origins, no unsafe-inline or unsafe-eval scripts, object/base/frame protections and minimal provider exceptions; audit legacy embedded styles separately | Chromium reports no CSP violations on supported flows; injected inline script is blocked; Stripe/Alpaca redirects and hosted pages work |
| F14 | Input validation and safe output | Strict schemas on body/query/params, size limits, unknown-key policy, parameterized SQL, safe normalization and context-appropriate escaping | XSS/injection/prototype pollution/oversized payload tests; plain text rendered inert; do not corrupt legitimate text by double-escaping stored JSON |
| F15 | CSRF protection | Cryptographic session-bound token, constant-time verification, strict origin validation and secure cookies on browser mutations; signed provider webhooks have a separate authenticated exemption | Missing/wrong/cross-session tokens fail; legitimate POST/PUT/PATCH/DELETE work; forged webhook fails provider signature verification |
| F16 | Micro-interactions | Consistent ~200 ms hover/focus/press transitions, visible disabled states and reduced-motion override; avoid animating trading values deceptively | Desktop/keyboard/mobile checks; no layout shifts from focus/press and no motion dependence |
| F17 | Skeleton screens | Structure-matched accessible loading placeholders only while fetching; real empty/error states distinct; aria-busy and reduced-motion support | Delayed API shows skeleton, then actual data/empty/error; no indefinite skeleton after failure |
| F18 | Typography/whitespace | Shared scale, readable line-height, tabular financial numerals, contrast and spacing tokens; responsive terminal density preserved | Desktop/mobile visual inspection, overflow and accessibility checks; form text and targets legible |
| F19 | Glass/depth effects | Subtle translucent navigation/dialog backdrop and elevated surfaces with solid fallback and adequate contrast | Dark/light/mobile/modal tests; focus trap, backdrop interaction and reduced transparency behavior verified |
| F20 | System-aware themes | Calibrated dark/light tokens, system/default/manual modes, persistent preference, early external-script initialization without inline CSP exception | System preference, change event, override, reload and first-paint tests; charts/dialogs/skeletons all themed |

Public browser forms receive CSRF protection and honeypot validation even when they are guest forms. Provider-to-server webhooks do not possess a browser CSRF token: verify Stripe signatures against the raw body, reject replay/duplicates safely and apply endpoint-specific abuse limits. Payment fulfillment must not depend on redirect completion. This is an explicit authentication boundary, not an unprotected mutation exception.

Core autosave uses revision/ETag conflicts rather than blind last-write-wins. Deletion deadlines live in the database rather than a tab timer; the toast countdown is a view of server state. Both must work with multiple VPS workers.

## Integrated implementation order

1. **Review:** finish route/action/API/dependency/configuration inventory and preserve the original baseline. Establish Git and a durable running log; never record secrets.
2. **Build foundation:** backend, PostgreSQL, configuration validation, structured errors/logging, migrations and server sessions. Implement F11–F15 at the boundary before adding public writes.
3. **Build first real customer workflow:** F01–F05, F07, F09–F10 with persisted onboarding/watchlist/preferences. Install Playwright/Chromium and test real API/database behavior immediately.
4. **Build revenue and trust:** approved Stripe Checkout/Portal/webhooks, server entitlements, genuine aggregate activity F06 and real capacity policy F08. Fake events are allowed only in isolated tests, never in production seed data.
5. **Build broker product:** Alpaca connection/account sync, real trader supply/history, server risk and order lifecycle, reconciliation, paper validation and authorized live pilot per WP4–WP8 of the roadmap.
6. **Polish:** F16–F20 and all page/error/legal/help navigation; test desktop/mobile/dark/light with CSP enforced on the actual production server.
7. **Harden delivery:** implement the VPS contract below; exercise staged release, failed-candidate rollback, migration backup and graceful drain.
8. **Verify launch:** run all roadmap and feature gates against the exact release artifact; capture provider evidence and operator handoff before marketing.

The repeating development loop is **Review → Build → Fix → Chromium Test → Verify**. A failed assertion, lint/type error, unhandled browser exception, data discrepancy or relevant audit finding goes back into the loop. Do not suppress a failure to get a green dashboard. Do not claim all possible bugs are eliminated; report the exact checks and scope verified.

## Playwright and quality contract

- Configure Chromium desktop and mobile projects, isolated accounts/data, traces and screenshots on failure, and deterministic provider-boundary fault injection.
- Use the real built frontend, backend and PostgreSQL for normal integration flows. Mock only external failures or deterministic unit cases; separately verify real Stripe/Alpaca sandbox contracts.
- Register `pageerror`, console errors, failed requests and CSP violations. Core success journeys must produce no unexpected browser errors. Negative-path tests explicitly assert the intended HTTP/error state without blanket console suppression.
- Cover all F01–F20 IDs in an acceptance map. Add auth/tenant tests, accessibility checks, billing lifecycle/replay, broker permission and duplicate/timeout/order-state tests.
- Run lint, strict type checks, build, unit/property/integration tests, dependency/secret scans and the complete Chromium regression suite after meaningful changes.
- Preserve report artifacts and record counts, failures, skipped tests and environment. A skipped provider/VPS test remains unverified and cannot support a production-ready claim.

## VPS deployment contract for mirrortape.net

### Inspection and configuration

Inventory the actual VPS OS, CPU/RAM/storage, listening ports, existing sites, proxy, service manager, database, backups, release layout and secrets ownership before changing it. The project has no verified VPS connection. Prepare code locally while awaiting details; do not overwrite another hosted application.

Default proposed deployment: Caddy reverse proxy; two versioned Node service instances on loopback candidate/stable ports; PostgreSQL; systemd template units. Preserve an existing suitable Nginx/PM2 installation if inspection finds one. Avoid cluster features that duplicate account writers or hide process-local session/rate-limit bugs.

### Reverse proxy

- Canonical `mirrortape.net`; redirect `www` only after its DNS and certificate work. Local DNS checks returned no A/AAAA/CNAME answers at inspection time; verify authoritative DNS before drawing a conclusion about propagation or ownership.
- Automatic managed HTTPS, HTTP/2, gzip (Brotli only if the installed server supports it), explicit request-body/time limits, HSTS after HTTPS verification, nosniff, deny framing, strict referrer policy and permissions policy.
- Enforce app CSP without inline-script exceptions. Keep API/cookie responses uncacheable and hashed static assets immutable.
- Support event-stream buffering/idle behavior and WebSocket upgrade if the implementation uses WebSockets. Do not introduce WebSockets solely to satisfy a configuration example.
- Validate proposed configuration before atomic activation. Keep the previous verified upstream mapping for rollback.

### Process lifecycle

- systemd automatic restart with bounded backoff, non-root runtime identity, protected files, explicit writable directories, environment file with restricted permissions and log output to journald.
- On SIGTERM/SIGINT: fail readiness, stop claiming work, drain HTTP/in-flight operations within a deadline, release ownership safely, close DB/queue connections and exit.
- Database-backed sessions, rate limits, deletion deadlines, leases and queue state survive reload and work across both instances.
- Candidate readiness checks include DB/schema compatibility. Liveness must not restart every process simply because an upstream broker is unavailable.

### Migration safety

- Additive expand/contract migrations with version/checksum tracking, advisory locking, lock/statement timeout and tested prior-version compatibility.
- Take a verified restricted-permission pre-migration backup using a credential mechanism that avoids printing secrets. Check backup success and available space before schema mutation.
- Transactional migrations where supported. Any operation unsuitable for a transaction, such as a required concurrent index build, needs an explicitly designed separate migration path; never pretend wrapping it makes it safe.
- Test against realistic data size. Do not promise zero locks: bound lock acquisition and abort safely rather than disrupt live traffic.
- Automatic application rollback must not automatically restore a database backup over new customer writes. Revert code only within the documented compatible schema window; retain the backup for a controlled recovery procedure.

### deploy.sh requirements

1. Strict shell handling with timestamped logs, safe failure traps and a single-deploy lock. Support validation/dry-run before mutations.
2. Verify required tools, production origin, secrets presence without echoing values, database connectivity, disk capacity, release identity, proxy configuration and rollback target.
3. Stage an immutable release without modifying the active checkout. Build in a dedicated stage using pinned development/build dependencies; the runtime stage installs only production dependencies. A TypeScript/Vite build cannot honestly be performed using omitted build tools.
4. Run quality gates or verify trusted CI artifact evidence; record commit/artifact hash, dependency lock hash and schema version.
5. Back up, verify backup and apply approved compatible migrations under the migration lock.
6. Start the candidate on its own loopback port. Check readiness and basic page/API responses within 30 seconds, including the expected release ID.
7. Validate and atomically switch the proxy; reload it without dropping existing connections. Probe the routed application as well as the candidate loopback service.
8. On failed health/switch, atomically restore the previous upstream and stable release, verify its health, and stop the failed candidate. First release with no prior stable target must fail clearly and keep exposure closed.
9. Drain the previous instance only after cutover succeeds; preserve prior assets long enough for already-open browser tabs and retain rollback releases.
10. Print exact release, health and rollback results. Do not delete releases, backups or user data automatically without the user's deletion authorization.

Prove the script on a staging VPS or equivalent Linux environment with an existing live connection, a failing candidate, a migration lock failure, missing config and repeated deployment. A successful local shell syntax check alone cannot certify zero downtime.

## Running evidence and completion label

Maintain `docs/IMPLEMENTATION_LOG.md` with each increment's built features, touched modules, failures, fixes, test commands/counts and unresolved external dependencies. Keep acceptance evidence linked by F01–F20 and roadmap WP number.

Only use **SYSTEM PRODUCTION-READY** after all 20 features, the entire approved trading/SaaS scope, Chromium/static/security checks, provider approvals and actual VPS release/recovery gates pass. Until then use a precise status such as implemented and verified locally, provider acceptance pending, or VPS deployment unverified. The user's desired completion label is not permission to fabricate evidence.
