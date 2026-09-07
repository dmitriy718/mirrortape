# MirrorTape implementation and release evidence

Date: September 6, 2026. **Status: implemented and verified locally for the research workspace; not production-ready for mass marketing or copy trading.**

The initial repository was a React 19/TypeScript/Vite/Tailwind frontend with synthetic trading content. The current active application uses Fastify 5 and PostgreSQL 16 for persisted state, sessions and provider boundaries. The original demo/design source is retained as reference and excluded from active routes. The full product roadmap remains binding; this report does not redefine a research workspace as a finished copy-trading SaaS.

## Feature acceptance map

| ID | Implemented behavior | Evidence / qualification |
| --- | --- | --- |
| F01 | Contextual dismissible onboarding guidance, restorable and persisted | Chromium dismissal/reload/restore on desktop and mobile |
| F02 | Five-second server deadline and signed tenant-bound undo, including page reload | API deadline/ownership tests; Chromium undo/expiry/reload; device-clock regression |
| F03 | Actual session/draft/watchlist loading stages and visible action progress | Chromium holds the draft response and verifies intermediate progress |
| F04 | Debounced server drafts, acknowledged timestamps, revision conflicts, ordered saves, navigation guard | Chromium partial input, reload, failed save, concurrent typing and navigation; API conflict checks. Passwords/tokens intentionally excluded. |
| F05 | Plain-language errors with retry or explicit refresh/manual-entry fallback | Injected save/provider failures and one-click recovery in Chromium |
| F06 | Recent real opt-in activity, rounded counts and minimum-five privacy threshold | API/Chromium tests with isolated fixture events; empty production data creates no notification |
| F07 | Email-first three-stage onboarding, usable without an email | Chromium validates partial email and advances the wizard |
| F08 | Genuine capacity reservation ledger, configured deadline and atomic capacity check | API concurrency and Chromium actual reservation tests. Production capacity defaults to zero. |
| F09 | Guest research workspace; later account upgrade preserves its records | Chromium guest, registration, verification and sign-in journeys. No guest trading authority. |
| F10 | Native autocomplete, inline email validation, opt-in Google Places proxy, keyboard selection, manual fallback | API provider contract and Chromium UI fixture tests. Actual Google project/quotas/provider policies not verified. |
| F11 | Honeypots on public forms; populated traps do not create requested records | API and Chromium watchlist trap checks |
| F12 | PostgreSQL sliding windows, shared locks, increasing penalties, 429 and Retry-After | API shared/concurrent behavior and forwarded-IP spoof checks; browser API 429 test |
| F13 | Header CSP blocks inline/eval scripts and unauthorized origins | Chromium attempted inline injection is blocked; API checks restrictive headers |
| F14 | Strict schemas, parameterized SQL, markup/control-character rejection, React output escaping | API unknown fields, oversized payload, XSS/prototype checks; browser API rejection |
| F15 | Session-bound cryptographic CSRF token plus exact Origin requirement | API tenant/cross-origin tests and browser API missing-token rejection. Signed Stripe webhooks and state-protected OAuth callback use provider authentication. |
| F16 | 200 ms interactive transitions with reduced-motion support | Chromium computed-style and interaction checks |
| F17 | Content-shaped skeletons during actual loading | Chromium delayed API response test |
| F18 | Consistent spacing/type scale, responsive layouts and calibrated contrast | Chromium overflow checks plus axe WCAG A/AA checks on the workspace |
| F19 | Blurred navigation and elevated panels/toasts | Chromium computed backdrop blur plus desktop/mobile screenshot review |
| F20 | System/light/dark selection, saved override and immediate readable color changes | Chromium emulated preferences, reload and reduced-motion/contrast checks |

## Checks and artifacts

Run from `app/`: `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`, `npm audit --audit-level=high`.

- ESLint: passed with zero warnings/errors in the completed check run.
- Build: TypeScript frontend/backend and Vite passed. Main JavaScript approximately 466 kB before compression / 138 kB gzip, compared with approximately 775 kB before the active-route cleanup.
- Vitest: 20 tests passed across three files, using the real isolated PostgreSQL database for API integration.
- Chromium: **42 tests passed, zero failed, zero skipped** in the final local regression run (2.0 minutes). Tests run once each with retries disabled, one worker, desktop and Pixel 7 viewports.
- Console/page errors are monitored for every browser test. Tests deliberately triggering 503 responses or CSP violations explicitly account for their expected browser messages; ordinary journeys must produce none.
- Dependency audit: zero known findings in the local npm audit result on the verification date. This is not a guarantee against undisclosed vulnerabilities.
- ShellCheck and `bash -n deploy/deploy.sh`: passed.
- Caddy 2.11.4: official release archive SHA-512 matched; production site configuration validated with only its upstream include path redirected to a local validation file. No certificate was issued and no public port was opened.
- Graceful shutdown: the isolated compiled runtime became ready and exited with code 0 after SIGTERM; sustained in-flight traffic and VPS reboot drills remain unverified.
- Backup: `scripts/backup-db.mjs` created an exclusive custom-format archive and validated its contents. Restored into a newly created local database `mirrortape_restore_20260906`; 17 public tables and the migration record were verified. Source data was not overwritten. The test restore database/archive are retained locally.
- GitHub Linux CI: [run 34067767935](https://github.com/dmitriy718/mirrortape/actions/runs/34067767935) passed for application commit `893bb73`, including all 42 Chromium cases. Caddy configuration also passed inside Linux. Actual VPS release remains unverified.

Playwright HTML/JSON reports, failure traces and screenshots are under ignored `app/playwright-report/` and `app/test-results/`. CI uploads those artifacts for 14 days. They may contain isolated test emails/tokens, so treat them as test artifacts rather than marketing assets.

## Issues found and corrected

The original lint run found 17 errors; these included mixed component exports, state updates during effects and unstable demo/render values. They were corrected while retaining the original source files. npm audit initially found 16 issues; dependency updates removed the reported findings. Dead registry-mirror lockfile URLs were corrected.

The first Chromium run passed 30/32: theme color transitions temporarily produced insufficient contrast. Removing color interpolation made both themes pass. An undo expiry assertion could pass before removal began; it now observes the visible undo window before waiting for expiry. The expanded account test revealed a navigation race in the test itself, fixed by observing completed sign-out before navigating. The Stripe transport fixture initially attached after SDK construction; the test now captures its transport before app creation. None of these failed runs are represented as passing.

Additional review changes include save-before-navigation, serial draft writes, server-clock undo countdowns, bounded refresh retries, account-registration locking, verification email resend, stronger versioned password hashing, bounded provider reads/timeouts, safe idle database error handling, connection discard on failed rollback, fresh Stripe reconciliation and release-specific rollback health checks.

Password hashing uses scrypt N=32768, r=8, p=3 with an explicit memory ceiling and legacy rehash on successful login. This parameter profile is listed in the [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). New passwords require 15 characters. Stored provider tokens and queued email content use authenticated AES-256-GCM encryption.

## Unfinished launch requirements

1. **Trading product implementation:** leader ingestion, validated historical performance, follow/copy configuration, execution policy/consent, order lifecycle and reconciliation, idempotent order placement, market/session rules, risk limits, kill switch, failure recovery, live/paper isolation, and evidence-based trader discovery. The current Alpaca integration is deliberately read-only and these systems are not implemented.
2. **Actual provider validation:** approved Stripe/Alpaca business accounts and app configuration, real sandbox checkout/refunds/webhook replay, real OAuth/permission/revocation checks, authenticated production email delivery, and actual Google Places project and policy validation. Deterministic provider fixtures cannot establish these results.
3. **Commercial operations:** approved legal/privacy/risk/refund documents, asset rights review, account export/deletion and retention policy, MFA/step-up for sensitive trading actions, support administration/staffing, incident ownership, and verified marketing claims. Support intake currently stores cases; it does not represent a staffed service.
4. **Remaining resilience work:** fault-injected rollback and reboot drills, load/soak tests, alerts, off-site backups and disaster-recovery exercises. The September 7 deployment below verifies the actual VPS, isolated secrets/database, DNS/TLS, migrations, graceful draining and successful blue/green releases. Live provider billing settings remain unchanged.

These gaps are material. No “SYSTEM PRODUCTION-READY” assertion is warranted.

## September 7 — accounts, public demo and deployment increment

The demo and private dashboard are now separate routes and data stores. `/app` requires an authenticated session, and private watchlist/brokerage APIs enforce authentication. New email/password accounts can use the dashboard while awaiting email verification. Google/Apple/Facebook authorization-code integrations use provider-bound identities, signed token verification where applicable, explicit linking for email collisions, and rotated sessions. Credentials and live-provider acceptance remain external requirements. See [provider setup](SOCIAL_AUTH_SETUP.md).

Public visitors receive distinct CTAs on at least five pages, a timed/session-capped desktop exit invitation, an interactive demo, clearer signup guidance and progressive onboarding. [Research and qualifications](CONVERSION_RESEARCH.md). New tests cover all three providers with deterministic external responses, nonce/audience/browser binding, identity collision, token ownership, revoked sessions, protected routes, demo isolation, CTAs and modal behavior. The first expanded local run passed 31 backend/security tests and 50 Chromium cases; final deployment evidence is recorded in the implementation log.

The inspected VPS runs existing CodexStore services and host Node 20. The new Docker deployment definition isolates MirrorTape's Node 24 runtime and PostgreSQL database, preserves Caddy's existing sites, stages blue/green releases, retains hashed assets and takes a verified pre-migration backup. The domain now resolves through Cloudflare, and public HTTPS is verified. Caddy obtained a trusted certificate; the initial Cloudflare 525 cleared after issuance.

## September 7 — live VPS and edge verification

MirrorTape is deployed at https://mirrortape.net on the authorized VPS. The database and active Node 24 container are isolated from the twelve existing CodexStore containers, which remained healthy. Both migrations are applied. Root-only secret files remain mode 0600. No existing client database was provided or imported. No real provider transactions or trades were performed.

- Application checkpoint `091d143` passed [Linux CI 34101826554](https://github.com/dmitriy718/mirrortape/actions/runs/34101826554): clean dependency installation, deployment syntax checks, lint, build, zero dependency audit findings, 31 integration/security tests and 50 Chromium cases.
- Public smoke validation passed all 18 desktop/mobile route combinations with zero console errors, no horizontal overflow, private route redirects, distinct CTAs and Secure/HttpOnly/SameSite=Lax session cookies. Command: `cd app && node scripts/smoke-public.mjs`. JSON and screenshots are in ignored `app/test-results/public-*` artifacts.
- Two actual Caddy proxy regression tests passed on macOS and Ubuntu: forwarded-header spoof rejection and trusted Cloudflare forwarding, including preservation of `no-store` with `no-transform`. Command: `CADDY_BIN=/path/to/caddy node --test deploy/tests/proxy.test.mjs`.
- A blue-to-green release to `3c12806` passed 48 continuous public HTTPS readiness probes with zero failures; both the previous and new release IDs were observed. The previous application container exited cleanly. This is observed continuity during one release, not a universal uptime guarantee.
- Backups were created before migrations and validated using `pg_restore --list`. Production backup restoration and a fault-injected production rollback were not performed; those remain explicit resilience checks.

The live browser initially failed its zero-console gate because Cloudflare injected analytics and inline scripts that violated CSP. Adding the documented `no-transform` directive removed the injected scripts; CSP remains restricted to same-origin scripts. Client IP forwarding is scoped to verified Cloudflare ranges rather than trusting arbitrary incoming headers or changing other sites' global trust settings. CSRF tokens and referrers are removed from Caddy access logs.

The root preflight initially rewrote the Git index with root ownership, blocking a subsequent pull. The index ownership was repaired; both preflights now use Git's no-optional-locks mode and fail on inspection errors. Clean checkout access and safe provisioner reruns were verified.

Social-provider buttons remain unavailable until real Google/Apple/Facebook credentials and provider approvals are configured. SMTP is absent: new password accounts can use their private research workspace, while verification/recovery delivery remains unavailable. Existing clients need their actual source database and a reviewed import. These limitations, plus the unfinished trading/commercial/resilience requirements above, prevent a mass-market production-ready assertion.

Final application release: `5cc09836e89fb39d42cb5530e46b615f18145b47`, active on the VPS. [CI run 34103096934](https://github.com/dmitriy718/mirrortape/actions/runs/34103096934) passed 32 integration/security tests and 50 Chromium tests, along with lint, build, deployment syntax checks and zero audit findings. The additional integration test exercises real password registration, session rotation, private access and returning-client login with SMTP explicitly absent; the API no longer promises an email in that configuration. The final green-to-blue rollout passed 13 additional continuous HTTPS readiness probes with zero failures and both release IDs observed.

## September 7 — 625 Technologies Inc. public-site increment

- Added the US-focused company and policy pages, public contact intake, live configuration/readiness status, release notes and four original journal articles. The build generates 23 complete public HTML pages with metadata, sitemap, RSS and a branded social preview. See [content and operational details](PUBLIC_SITE.md).
- Password signup requires versioned Terms/adult agreement; new social identities require agreement bound to the exact OAuth state. Existing identities remain able to sign in. Support requests now use owner/content-bound idempotency, verified with a lost-response browser test, and a dedicated submission limit.
- Passed locally: lint, frontend/backend build, **39 integration/security tests**, **62 Chromium desktop/mobile tests** with retries disabled, and zero dependency audit findings. The final one-line compatibility read adjustment was followed by the full 39-test integration run; exact-release Linux CI also runs the entire browser suite before deployment.
- The initial expanded browser run passed 59/62. Two failures were a test incorrectly treating the metadata map as an array; the third found 4.37:1 contrast on a light-theme journal caption. Both causes were corrected. The subsequent complete browser run passed 62/62, including light/dark accessibility, JavaScript-disabled policy reading, contact draft restoration and status-check recovery. Intentional network/503 fault injections are explicitly identified; normal journeys require no console errors.
- Local full-runtime public smoke: **48 desktop/mobile route checks**, zero console errors and no horizontal overflow; the private dashboard guard remains enforced. Desktop journal and mobile contact screenshots were visually reviewed. This is not a blanket WCAG conformance claim.
- A compatibility checkpoint `e3940c5` precedes the release so retained code can read additive draft metadata on rollback. New API input remains strictly validated. There is no schema migration in this increment. The production release and live checks will be recorded after execution.

Remaining launch work is still material: legal/operator review of the published notices, actual privacy/support fulfillment, retention schedules, company contact details, live provider configuration and acceptance, account import, trading functionality and resilience drills. Publishing policy text does not complete those obligations.

### Public-site deployment verified

Application release **`6bfdd590011e23fe1cbc163a3bf7bf2abb84d961`** is live at https://mirrortape.net in the blue slot. [Linux CI 34113943599](https://github.com/dmitriy718/mirrortape/actions/runs/34113943599) passed the exact release, including 39 integration/security tests, 62 Chromium cases, lint/build and the dependency audit. Compatibility release `e3940c5` first passed [CI 34113803941](https://github.com/dmitriy718/mirrortape/actions/runs/34113803941), including its existing 50 Chromium cases.

The compatibility and full releases passed 20 and 22 consecutive public HTTPS readiness probes respectively, with zero failures and both old/new SHAs observed at each switch. Each release took a custom-format backup validated by the deployment script. The retained compatibility container exited with code 0. MirrorTape's application/database and all twelve existing CodexStore containers were healthy afterward; secret files remain mode 0600 and the configuration fingerprint is unchanged.

The deployed domain then passed all **48 desktop/mobile public smoke checks**, with **zero console errors**, no horizontal overflow and the private-dashboard redirect intact. Live Privacy HTML includes the actual policy body and company identity; HTTPS responses retain HSTS, restrictive CSP, frame denial, no-sniff, referrer policy and `no-transform`. The status endpoint reports workspace availability while SMTP, Stripe, Alpaca and all three social providers remain disabled. No production customer signup, payment, broker action or support submission was fabricated for these read-only checks.

Commands: `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`, `npm audit --audit-level=high`; VPS `sudo ./deploy/vps-release.sh /srv/mirrortape/source --check` and `--apply`; final `cd app && node scripts/smoke-public.mjs`. Live smoke JSON/screenshots remain in ignored `app/test-results/public-*`; release probe JSON/logs are in ignored `.runtime/`. Local development runtime was also restarted with the latest compiled server and verified ready on port 3100.
