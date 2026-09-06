# MirrorTape

MirrorTape is being developed for **mirrortape.net**, with **Stripe** subscriptions and **Alpaca** as the first brokerage. This repository contains a working research workspace and the initial account/provider infrastructure. **It is not ready for a public financial-product launch.**

The original frontend presented simulated trading activity, trader rankings and performance claims without a backend. The active routes now show persisted user data and explicit unavailable states. Original design/demo source remains in Git for reference but is not imported by the active application. No orders are submitted, no returns are invented, and no payment succeeds based on a browser redirect.

## What runs

- Guest research workspace, watchlist, five-second server-enforced undo, persisted onboarding and form drafts, conflict detection, safe navigation, support intake and dark/light/system themes.
- PostgreSQL-backed sessions, email registration/verification/resend/recovery, encrypted email outbox and brokerage tokens, tenant isolation, progressive shared rate limits, origin/CSRF enforcement and restrictive script CSP.
- Optional Stripe Checkout, customer portal and signed, deduplicated webhook reconciliation. Optional Alpaca OAuth and **read-only** paper/live account views. Google Places suggestions require user consent and server configuration.
- Genuine opt-in aggregate activity with a privacy threshold and optional capacity reservations. Both are hidden when unavailable; capacity defaults to disabled.
- Chromium desktop/mobile tests, real PostgreSQL integration tests, CI, Caddy/systemd definitions and staged deployment/rollback scripts.

See [verification and remaining work](docs/VERIFICATION.md), the [full roadmap](PRODUCTION_READINESS_PLAN.md), [delivery contract](EXECUTION_CONTRACT.md), and [VPS runbook](deploy/README.md).

## Local setup

Requirements: Node **24.18 or newer within 24.x**, npm, and PostgreSQL 16. Keep PostgreSQL bound to loopback for local work. Create a dedicated database and role through your existing database administration process; the application never creates a production database or changes production credentials.

```bash
cd app
npm ci --ignore-scripts
cp -n .env.example .env
chmod 600 .env
```

Edit the ignored `.env` file: set `DATABASE_URL` for the dedicated database, a random `SESSION_SECRET` of at least 48 characters, and a 64-character hexadecimal `ENCRYPTION_KEY`. Generate the latter two locally using `openssl rand -hex 48` and `openssl rand -hex 32`; store them securely. Do not paste secrets into issues, chat, logs or Git. Keep `APP_ORIGIN=http://127.0.0.1:3100` and `PORT=3100` for this setup.

```bash
npm run db:migrate
npm run build
npm start
```

Open **http://127.0.0.1:3100**. The production-style server serves both the frontend and API and enforces CSP. `npm run dev:server` watches backend source. If using Vite hot reload, set `APP_ORIGIN` to the actual Vite origin in your local configuration and start both `npm run dev` and `npm run dev:server`; restore the full-server origin before testing the built app. Never expose a development server as production.

`GET /health/live` checks the process; `GET /health/ready` checks the database and required schema and includes the release identifier.

## Verification

From `app/`:

```bash
node scripts/init-test-db.mjs
npx playwright install chromium
npm run check
npm audit --audit-level=high
```

The initializer creates or reuses **mirrortape_test** on the configured local cluster and preserves an existing matching `.env.e2e`. It never wipes a database or rotates existing test keys. Test suites reject a database whose name does not end in `_test`. Tests modify fixture rows in that isolated database; never point them at customer data. Chromium uses loopback ports **3110** and **3325** (local SMTP fixture). CI provisions PostgreSQL independently and supplies test-only environment values.

`npm run check` runs ESLint, TypeScript/client/server build, Vitest and Playwright. Playwright reports are generated in `app/playwright-report` and `app/test-results` and excluded from Git. Provider contract tests use deterministic external responses; they are not evidence of live provider approval or a successful real payment/trade.

## Configuration

All settings are documented in [app/.env.example](app/.env.example). No server credential belongs in a `VITE_` variable.

| Configuration | Behavior |
| --- | --- |
| `SMTP_URL`, `MAIL_FROM` | Enable account emails. Production requires TLS; configure SPF/DKIM/DMARC and verify delivery separately. |
| Stripe key, webhook secret, price ID, `BILLING_ENABLED` | Billing stays closed unless all required settings and approved terms/privacy URLs are present. Subscribe the endpoint `/api/webhooks/stripe` to the supported events documented in the VPS runbook. |
| Alpaca client ID/secret | Enable OAuth connection to an existing Alpaca account. Callback: `/api/brokers/alpaca/callback`. Live connection additionally requires `ALPACA_COMMERCIAL_APPROVED=true`. No trading scope is requested. |
| `GOOGLE_PLACES_API_KEY` | Enable server-proxied address suggestions after user consent; manual entry always works. Configure provider restrictions and policy attribution before public use. |
| `COHORT_CAPACITY`, `COHORT_END` | Real reservation capacity and optional deadline. Keep capacity zero unless an actual cohort is being operated. |
| `LEGAL_TERMS_URL`, `LEGAL_PRIVACY_URL` | Operator-approved published documents; no generated legal text is represented as approved. |
| `TRUST_PROXY` | Use `loopback` only behind the provisioned local reverse proxy; otherwise keep `false`. |

## Security and operations boundaries

Passwords are excluded from autosave and hashed with versioned scrypt parameters; tokens are never stored in browser local storage. Encryption keys must be backed up separately from database backups. The script CSP permits only same-origin scripts; style attributes remain allowed for React layout. Strict schemas accept plain text rather than interpreting submitted HTML; React performs output escaping. Stripe webhooks use signature authentication rather than browser CSRF tokens. Alpaca's GET OAuth callback is protected by a single-use, session-bound state value.

Support requests are persisted with references, but there is no staffed support service or admin queue UI yet. Guest-data retention/export/deletion policy, MFA/step-up for future trading, production monitoring/alerting, disaster recovery, verified marketing claims and legal/provider approval remain launch gates. Do not enable billing for an unfulfilled service.

No open-source license grant has been added to this application source. Review asset provenance and third-party notices before distribution.
