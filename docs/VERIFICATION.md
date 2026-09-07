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
4. **VPS and resilience:** inspect the actual OS/topology/resources; provision reviewed secrets/DNS/TLS/proxy/service permissions; execute migrations with approved backups; run successful and failing release/rollback probes, reboot/graceful-drain checks, load/soak tests, alerts, off-site backups and disaster-recovery drills. No production infrastructure, billing settings or credentials have been changed.

These gaps are material. No “SYSTEM PRODUCTION-READY” assertion is warranted.

## September 7 — accounts, public demo and deployment increment

The demo and private dashboard are now separate routes and data stores. `/app` requires an authenticated session, and private watchlist/brokerage APIs enforce authentication. New email/password accounts can use the dashboard while awaiting email verification. Google/Apple/Facebook authorization-code integrations use provider-bound identities, signed token verification where applicable, explicit linking for email collisions, and rotated sessions. Credentials and live-provider acceptance remain external requirements. See [provider setup](SOCIAL_AUTH_SETUP.md).

Public visitors receive distinct CTAs on at least five pages, a timed/session-capped desktop exit invitation, an interactive demo, clearer signup guidance and progressive onboarding. [Research and qualifications](CONVERSION_RESEARCH.md). New tests cover all three providers with deterministic external responses, nonce/audience/browser binding, identity collision, token ownership, revoked sessions, protected routes, demo isolation, CTAs and modal behavior. The first expanded local run passed 31 backend/security tests and 50 Chromium cases; final deployment evidence is recorded in the implementation log.

The inspected VPS runs existing CodexStore services and host Node 20. The new Docker deployment definition isolates MirrorTape's Node 24 runtime and PostgreSQL database, preserves Caddy's existing sites, stages blue/green releases, retains hashed assets and takes a verified pre-migration backup. Public HTTPS depends on the owner's DNS change.
