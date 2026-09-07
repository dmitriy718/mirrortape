# MirrorTape implementation and verification log

## September 6, 2026 — discovery and merged delivery specification

- Inspected React/TypeScript/Vite frontend, routing, state, simulated market engine, pricing actions, security/performance claims and project configuration.
- Confirmed no existing backend, migrations, application tests, CI/deployment definition or Git checkout in the inspected workspace.
- Reran build, lint and dependency audits; preserved actual baseline output under [production-audit](production-audit/README.md).
- Created [production roadmap](../PRODUCTION_READINESS_PLAN.md) and [unified execution contract](../EXECUTION_CONTRACT.md), including all F01–F20 features and VPS release/recovery requirements.
- Recorded user choices: mirrortape.net, Stripe payments and Alpaca first brokerage.
- Verified PostgreSQL 16.14 tooling is installed locally. No database cluster was initialized or modified.
- Local DNS queries returned no A/AAAA answer for mirrortape.net or CNAME for www at inspection time. Authoritative DNS/ownership and VPS state remain unverified.
- Application source code was not changed during this planning increment. No production deployment or provider transaction occurred.

## Acceptance state

F01–F20: specified; implementation and acceptance testing pending.

Build: passed. Lint: 17 existing errors. Dependency audit: 16 findings overall, including one runtime high finding. Playwright/Chromium: not installed or run for this project yet. Stripe/Alpaca integration: not implemented or verified. VPS deployment and rollback: not implemented or verified.

## External configuration still required

VPS OS, host/access method, current web server/process manager, deployment directory and database; Stripe and Alpaca account setup/approval status; transactional email and address-provider details. Do not paste credentials into this log or commit them.

## September 6, 2026 — implementation and verification increment

This entry supersedes the planning-only acceptance state above; the earlier section records the initial discovery checkpoint.

- Connected the user-provided GitHub origin and preserved the inspected frontend baseline in Git.
- Built the PostgreSQL/Fastify account and research-workspace backend; added the twenty requested UX/security behaviors with explicit provider/capacity gates. Replaced active synthetic marketing/trading routes with truthful persisted state; retained original design source.
- Added Stripe subscription/portal/webhook integration code and Alpaca read-only OAuth/account integration code. No actual payments or orders were placed.
- Added Chromium desktop/mobile, API/provider-contract and cryptographic tests. Fixed the initial lint, dependency, contrast, autosave/navigation and undo-verification issues described in [the verification report](VERIFICATION.md).
- Initialized a dedicated local PostgreSQL cluster on loopback port 55483 with isolated application/test databases. Existing unrelated database services were preserved. Local secrets and runtime data are ignored by Git.
- Added Caddy/systemd release configuration, backup-first migrations, a health-checked staged deployment script with rollback, CI and a manually triggered protected VPS release workflow.
- Verified shell syntax/ShellCheck, Caddy configuration, custom-format backup creation and restore into a new isolated local database (17 tables). Docker daemon inspection succeeded, but new Caddy containers stayed in `Created`; Caddy configuration was validated using a checksum-verified local binary instead. Existing containers were not restarted.
- Updated setup, environment, operations and explicit launch-gap documentation. Full financial SaaS readiness remains incomplete for the reasons in [VERIFICATION.md](VERIFICATION.md).

Local final checks: 20/20 Vitest tests and 42/42 Chromium desktop/mobile tests passed with zero retries or skips; ESLint and frontend/backend build passed; npm audit reported zero findings. A subsequent screenshot-position-only test adjustment was verified with both affected Chromium cases passing. The isolated runtime readiness/SIGTERM probe exited with code 0.

Publication verified: application commit `893bb73d4c6957950c355bde647769aad557d74c` was pushed to the user-provided public repository. [GitHub Linux CI run 34067767935](https://github.com/dmitriy718/mirrortape/actions/runs/34067767935) passed clean installation, lint, build, dependency audit, 20 Vitest tests and 42 Chromium tests. Reports were uploaded by the workflow. Caddy validation subsequently also passed in the Linux container after its temporary include path was corrected; no existing containers were restarted. The local full application was restarted with the verified build and `/health/ready` returned `ready` on loopback port 3100. No production deployment occurred.

## September 7, 2026 — accounts, conversion flow and VPS release preparation

- Separated browser-only `/demo`, public marketing routes and authenticated `/app`; added public navigation that does not create anonymous database sessions merely to check login state.
- Added email/password signup and returning-client login, plus Google, Apple and Facebook authorization-code integrations with explicitly configured provider availability. Added signed token/issuer/audience/nonce validation, browser-bound single-use state, Google PKCE, Facebook application/token checks, explicit identity linking and atomic session rotation/revocation checks. Existing client records require their actual data source; no customer accounts were invented.
- Added seven page-specific public CTAs, a dismissible desktop exit invitation, lower-friction signup guidance and progressive onboarding. Research and inference boundaries are documented in CONVERSION_RESEARCH.md.
- Added isolated Docker/Compose Node 24 + PostgreSQL 16 deployment, a provisioner that preserves existing secrets/sites, and blue/green Caddy releases with validated backups, transactional additive migrations and health-checked rollback.
- Verified 31 integration tests and 50 Chromium desktop/mobile tests, ESLint, build and zero dependency audit findings. A final small provider-redirect draft flush and deployment hardening increment will also pass CI before release.
- Production social-provider credentials, SMTP and any existing client database have not been supplied. Buttons remain accurately unavailable where configuration is missing; production payment and trading enablement remain gated.

### VPS release completed and verified

- Provisioned isolated MirrorTape Node 24/PostgreSQL 16 containers on `65.75.201.59`, preserving the twelve healthy CodexStore containers and existing Caddy sites. Applied both transactional migrations after validated backups. Root-owned secrets are mode 0600 and absent from Git.
- Caddy obtained the domain certificate. `https://mirrortape.net` now returns HTTP 200 through Cloudflare; origin and public readiness report the deployed commit. The initial 525 resolved after certificate issuance.
- Fixed production-only Cloudflare script injection/CSP conflicts with `no-transform` while retaining private cache directives. Added source-restricted Cloudflare client-IP forwarding and CSRF/referrer log redaction. Two real Caddy regression tests pass on macOS and Ubuntu.
- Fixed root Git preflight index ownership and fail-open status inspection; safe provisioner and release reruns were verified without replacing secrets.
- Final application release `5cc0983` passed [CI 34103096934](https://github.com/dmitriy718/mirrortape/actions/runs/34103096934): 32 integration/security tests, 50 Chromium cases, lint/build, deployment syntax checks and zero audit findings. The absent-SMTP signup/login test verifies actual account/session behavior without claiming email delivery.
- Public browser smoke checks passed 18 desktop/mobile route combinations with zero console errors. Blue/green releases were observed through 48 and 13 consecutive public health probes, respectively, with zero failures. Previous processes stopped with exit code 0. Backups, previous images and hashed assets are retained.
- No existing client database was supplied or imported; no live social-provider, Stripe, Alpaca or SMTP credentials were supplied or activated. Fault-injected rollback, off-site restore, load/soak and the remaining commercial/trading launch work are not represented as complete. See VERIFICATION.md for explicit remaining requirements.

## September 7, 2026 — company, policies and journal

- Applied the owner's company/market facts: MirrorTape is a product of 625 Technologies Inc., marketed to the United States.
- Built Terms, Privacy, Cookies, Accessibility, About, Security, Billing/refunds, Changelog, Contact, Status, Journal and four full article pages. Added footer discovery, page-specific metadata, production prerendering, sitemap/RSS and a local branded social image.
- Added persisted public contact drafts and request references, safe retries without duplicate cases, versioned signup agreement records and OAuth-state-bound agreement for new social accounts.
- Fixed the journal caption contrast defect found by Chromium/axe, a test metadata iterator mistake, development-mode leakage into local production builds, and compatibility of stored draft reads across additive releases.
- Local gates passed: 39 integration/security tests, 62 Chromium cases, lint/build, zero audit findings and 48 public runtime smoke checks. Company/policy content, release compatibility and remaining operational/legal review are documented in PUBLIC_SITE.md. Production release evidence follows after CI and VPS verification.

### Public-site release completed

- Compatibility `e3940c5` and full application `6bfdd59` passed their exact Linux CI runs and deployed through the existing blue/green pipeline. The full release is active in blue; the retained compatibility release stopped with exit code 0.
- Observed 20 then 22 continuous public HTTPS probes with zero failures across both switches; backups were validated before each release. All twelve unrelated CodexStore containers remain healthy.
- Final production smoke passed 48 desktop/mobile route checks with zero console errors. Company identity, actual policy HTML, status gates, security headers and private-route separation were checked on mirrortape.net. Full evidence and remaining launch requirements are in VERIFICATION.md.

## September 7, 2026 — repeat audit and failure recovery

- Rechecked the existing twenty-feature acceptance map and active architecture. Full details and limitations are in AUDIT_2026-09-07.md.
- Added shared cross-tab draft comparison and explicit conflict resolution across account, contact and workspace forms. Independent edits combine without replacing each other. Contact topic state and retry references remain tied to the saved draft.
- Fixed maintenance/database shutdown ordering and controlled initialization failure cleanup. Added real-process Chromium SIGTERM/SIGINT tests with a blocked in-flight API request and a real-database maintenance drain test.
- Added root deploy.sh, bounded shared health helpers, atomic routing restoration, candidate retention when rollback fails, and routed HTTPS verification on same-release reruns. CI includes nine isolated release failure checks; two actual Caddy regression checks remain green locally.
- The first expanded run passed 43 backend/unit tests and 70 Chromium cases. A subsequent startup-failure check expanded Chromium coverage to 72. Its initial TypeScript nullable-capture failure was corrected before build/test execution. Final gate and deployment evidence follows after completion.

Local final regression: lint/build, 43 backend/unit tests, 72 Chromium cases, nine release fault tests, two actual Caddy proxy tests and zero npm audit findings passed. Follow-up shutdown assertions also passed on both viewports. This increment changes no schema or credentials; live provider acceptance remains blocked by configuration.

Visual follow-up found the sticky navigation could cover the newly opened comparison heading. The comparison now receives keyboard focus and scrolls below the measured navigation height. Both viewport cases passed focused assertions for heading position, focus, overflow and axe checks after the fix; desktop/mobile artifacts were generated and reviewed.

The final public status review replaced raw parser/timeout messages with a plain-language service/connection recovery message. Desktop/mobile tests now inject both HTTP 503 and malformed JSON before verifying successful recovery. Both cases, lint and build passed locally.

Conflict review now also exposes a failed refresh instead of hiding its error behind an existing comparison. Recovery clears that error after a successful comparison, and the server's conflict message directs users to review their changes. Desktop/mobile tests verify editing during comparison, an injected 503, successful retry and persistence of the latest text. Lint/build and both targeted cases passed.
