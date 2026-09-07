# MirrorTape VPS release runbook

**Alternative host-Node/systemd deployment. The selected VPS uses the [isolated Docker deployment](VPS_DOCKER.md); follow that runbook for codexstore@65.75.201.59.** Do not import this configuration over an existing server without first reviewing its current sites, services, database and backups. Public deployment needs the owner's explicit production authorization and configured provider accounts.

## Layout and prerequisites

The release implementation targets Linux with systemd, Caddy 2.11, Node 24.18+ in `/usr/bin/node`, npm, PostgreSQL 16 client tools, Git, curl, flock and standard GNU utilities. PostgreSQL may be local or remote with appropriately validated TLS. The supplied Caddy site uses automatic HTTPS/HTTP2, gzip/zstd compression, body limits, security headers and sensitive query/header log filtering. Caddy handles WebSocket upgrades automatically; this release has no WebSocket endpoint. [Caddy logging documentation](https://caddyserver.com/docs/caddyfile/directives/log) describes the filters.

Provision these paths after inspecting the existing VPS:

- `/srv/mirrortape/releases`: immutable release directories; traversable parent, application contents owned by the dedicated `mirrortape` service user.
- `/srv/mirrortape/shared/assets`: retained hashed frontend assets readable by Caddy so older open pages can load their original chunks.
- `/srv/mirrortape/backups`: owner-only database archives and rollback proxy mappings.
- `/etc/mirrortape/app.env`: root-owned mode 0600, real production configuration.
- `/etc/mirrortape/instances`: root-owned per-release loopback port/release configuration.
- `/etc/systemd/system/mirrortape@.service`: reviewed copy of the supplied service unit, then `systemctl daemon-reload`.
- `/etc/caddy/Caddyfile`: import the reviewed `mirrortape.caddy` site, preserving existing sites. It imports `/etc/caddy/mirrortape-upstream.caddy`.

Create the `mirrortape` service identity without interactive login. The deployment operator needs narrowly controlled root privileges for this release layout. Run the application as the service identity, never root. Build/install scripts operate only in a new staging release. Leave ports 3101 and 3102 on loopback; expose only the reviewed Caddy HTTPS/HTTP endpoints. Check DNS for `mirrortape.net` before certificate issuance. Do not add a www redirect until its DNS and certificate are configured.

Before the first release, use an explicit maintenance response in `mirrortape-upstream.caddy`:

```caddyfile
respond "MirrorTape is undergoing maintenance. Please return shortly." 503
```

Validate and reload the existing proxy only after operator review. The first deployment can restore this maintenance mapping, but cannot provide uninterrupted application service where no prior release exists.

## Production environment

Start from `app/.env.example` and populate the secret file through a secure channel. Set `NODE_ENV=production`, `APP_ORIGIN=https://mirrortape.net`, `HOST=127.0.0.1` and `TRUST_PROXY=loopback`. The instance file selects the candidate port and release ID. Keep billing and live brokerage access disabled until approved. Preserve the encryption key in an independently secured recovery location; losing it makes broker tokens and queued mail unreadable.

Register the Alpaca redirect `https://mirrortape.net/api/brokers/alpaca/callback`. The connection requests default read-only permissions. Register the Stripe webhook `https://mirrortape.net/api/webhooks/stripe` for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Verify delivery with the real configured API version and sandbox account before enabling paid access. Checkout/portal navigation alone does not change subscription state.

## Review and release

From a clean Git checkout on the VPS:

```bash
./deploy/deploy.sh "$PWD" HEAD --check
sudo ./deploy/deploy.sh "$PWD" HEAD --apply
```

`--check` validates read-only prerequisites and basic environment presence; it does not perform a deployment, a backup, or the full built configuration check. `--apply` acquires a deployment lock, stages the specified immutable commit, installs build dependencies, runs lint/build/audit, validates full configuration, creates and validates a database backup, runs transactional migrations, and installs production-only runtime dependencies. CI must pass for the exact commit before release. The script never modifies the active release directory.

The candidate starts as a separate systemd instance on the inactive loopback port. It must pass release-specific readiness within 30 seconds. Only then is the upstream mapping replaced atomically and Caddy validated/reloaded. HTTPS readiness must return the candidate release within 30 seconds before it becomes the recorded stable release. The previous process is then gracefully drained; its directory and assets are retained.

If candidate health fails before switching, the old mapping remains active. If routed health fails after switching, the trap restores and reloads the previous mapping and checks its local/HTTPS health. Rollback does **not** restore an old database over newly written data. Automatic rollback failure emits a critical operator message and requires immediate inspection.

The GitHub **Release to the configured VPS** workflow is manual (`workflow_dispatch`) and reruns the quality workflow before deployment. Configure a protected `production` environment with required reviewers, variables `VPS_HOST`, `VPS_USER`, `VPS_REPO_PATH`, and secrets `VPS_SSH_PRIVATE_KEY`, `VPS_SSH_KNOWN_HOSTS`. Verify the host fingerprint through an independent channel; the workflow never disables host-key checking. The remote source checkout must be disposable deployment source, separate from active releases. The workflow deploys the exact tested main commit and needs noninteractive sudo permission for the reviewed deployment script. No production secrets are stored in Git.

## Migration and restore discipline

Migration 001 only creates new application tables and indexes. Migrations have checksums, one transaction, a shared advisory lock, a five-second lock timeout and a 30-second statement timeout. Future schema changes must remain compatible with both active/candidate code. Do not edit an applied migration. Table rewrites, destructive changes and long-running index work require a separate reviewed plan; the current runner is not a universal online-migration solution.

The pre-migration backup uses custom-format `pg_dump`, exclusive output creation and archive validation. A successful archive listing is insufficient disaster-recovery evidence. Restore periodically into a **new isolated database** and verify schema plus representative user/provider records; never run restore over production as an automatic rollback. A local isolated restore was exercised for this change (17 tables and migration record verified). Production backup storage, encryption, off-site replication, retention and restore-time objectives still require configuration and drills.

## Health and recovery checks

```bash
curl --fail https://mirrortape.net/health/ready
systemctl status caddy
systemctl status 'mirrortape@*'
journalctl -u caddy --since '15 minutes ago'
journalctl --unit 'mirrortape@*' --since '15 minutes ago'
```

Use logs for release IDs, status and request IDs. Do not copy secret files or full customer records into incident tickets. Alert on repeated readiness failures, 5xx/429 spikes, exhausted email retries, webhook reconciliation failures, disk/connection pressure and failed backups. The repository does not yet provision alert delivery or a support/on-call rotation.

Before claiming zero downtime, run a sustained request probe across both successful and deliberately failed releases on the actual Linux environment, test service reboot recovery, validate systemd sandbox permissions, and perform a production-like backup/restore drill. These VPS checks have **not** been run here.
