# Deployment on codexstore@65.75.201.59

The inspected VPS runs Ubuntu 24.04, Caddy 2.11.4, Docker Compose and other production applications. Host Node is 20. MirrorTape therefore uses isolated Node 24 application containers and its own PostgreSQL 16 container and volume. No host Node upgrade or CodexStore database migration is required.

Files: `deploy.sh`, `app/Dockerfile`, `deploy/compose.yml`, `deploy/provision-vps.py`, `deploy/vps-release.sh`. The source checkout is `/srv/mirrortape/source`; secrets are root-owned mode 0600 under `/etc/mirrortape`. Application slots bind only `127.0.0.1:3101` and `127.0.0.1:3102`. The dedicated Docker subnet is `172.30.77.0/24`, checked against existing VPS networks. Only its host gateway is trusted for reverse-proxy IP headers. PostgreSQL has no published host port.

Caddy imports `/etc/caddy/sites/mirrortape.caddy`, preserving existing sites. That site imports `/etc/mirrortape/upstream.caddy`. Hashed assets from successful builds are retained in `/srv/mirrortape/shared/assets` for older browser tabs. Application logs are bounded and go to Docker's logging driver. Docker restart policies provide service resilience; graceful application shutdown has a 35-second container stop window.

## Initial provisioning

After inspecting free ports, Docker subnet availability and the existing Caddy imports, clone this repository into `/srv/mirrortape/source` as the deployment user. Run `sudo python3 /srv/mirrortape/source/deploy/provision-vps.py /srv/mirrortape/source`. It atomically creates a fresh, isolated configuration bundle only if none exists, preserves existing secrets on reruns, backs up the root Caddyfile and validates the additional site without reloading running services. A differing existing MirrorTape site requires inspection.

## Release

Run only a reviewed, clean, tested commit from the dedicated checkout:

```bash
sudo /srv/mirrortape/source/deploy/vps-release.sh /srv/mirrortape/source --check
sudo /srv/mirrortape/source/deploy/vps-release.sh /srv/mirrortape/source --apply
```

The first installation can use `--apply --await-dns` only while DNS is pending. This verifies candidate readiness and installs the Caddy mapping, but does not claim public HTTPS is working. Set an A record for the apex `mirrortape.net` to `65.75.201.59`. Remove a conflicting AAAA record unless this VPS's IPv6 address is separately verified. Do not configure a www alias until its corresponding site/redirect is provisioned. Caddy will request the certificate after DNS resolves correctly.

Later releases build an immutable commit-tagged image, create/validate a pre-migration backup, run the additive migrations, start the inactive application slot and check readiness. Caddy is validated and reloaded only after candidate health succeeds. HTTPS must report the expected release within 30 seconds; otherwise routing is restored and the failed candidate is stopped only after the previous release is verified healthy. A failed routing restore or unhealthy previous process leaves the candidate running for operator recovery and returns a failure. The database is never rolled back over new writes. Previous application images, assets and backup archives remain available; no volume or backup pruning is performed.

The earlier systemd/host-Node release scripts remain alternative deployment definitions. Do not run them on this Docker installation. The GitHub manual release workflow must use `vps-release.sh` for this host.

## Operational checks

```bash
sudo docker compose --env-file /etc/mirrortape/releases.env -f /srv/mirrortape/source/deploy/compose.yml ps
curl --fail https://mirrortape.net/health/ready
sudo journalctl -u caddy --since '15 minutes ago'
```

Never print `docker compose config` or container environment inspection output: they can contain secrets. Use `docker compose config --quiet` for validation. Backups live under `/srv/mirrortape/backups` with restricted access. Off-site backup retention, SMTP delivery, social-provider configuration and public TLS checks are separate operational requirements.

## Cloudflare and public browser verification

The MirrorTape site adds `Cache-Control: no-transform` while retaining the origin's `no-store`/`no-cache` directives. This prevents automatic HTML/script injection from conflicting with the strict `script-src 'self'` policy. Cloudflare documents this behavior for [Web Analytics](https://developers.cloudflare.com/web-analytics/faq/) and [JavaScript Detections](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/). If separate Cloudflare rules require JavaScript Detection success, review those rules before launch; MirrorTape's own rate limits, honeypots and CSRF checks remain enforced.

The site derives the forwarded client address from the actual remote connection. It accepts `CF-Connecting-IP` only from Cloudflare's explicitly listed [IPv4](https://www.cloudflare.com/ips-v4/) and [IPv6](https://www.cloudflare.com/ips-v6/) networks. Untrusted clients cannot supply their own forwarded identity. The release mapping forwards this derived address; the application trusts only its dedicated Docker gateway. Recheck the upstream network lists during infrastructure maintenance. Global trust settings for other VPS sites are not modified.

Run the Caddy regression tests with `CADDY_BIN=/path/to/caddy node --test deploy/tests/proxy.test.mjs`. They check spoofed-header rejection, trusted forwarding and preservation of private cache controls. Run the public browser smoke check from `app` with `node scripts/smoke-public.mjs`; it checks 48 public/auth/demo route and viewport combinations, the private route guard, responsive overflow and console errors. It does not register fabricated customers or execute payments/trades.


## Single-command entry point and failure checks

From the clean VPS checkout, `sudo ./deploy.sh --check` runs the read-only preflight and `sudo ./deploy.sh --apply` runs the existing Docker release pipeline. With no option it defaults to `--check`; unknown arguments are rejected. This wrapper deliberately does not select the alternative host-Node/systemd deployment.

A same-commit rerun checks both the active loopback process and routed HTTPS. Routing restoration stages an atomic replacement before validating/reloading Caddy. The rollback flag is set before the mapping mutation so interruption cannot skip restoration. If automatic restoration cannot be verified, the candidate is retained and a critical message identifies operator intervention; the release never reports success in that state.

`node --test deploy/tests/release.test.mjs` runs bounded real-HTTP readiness checks and isolated filesystem/control-flow fault tests. The administrative reload commands are test doubles in those fault tests; these are not a claim that production rollback, reboot or disaster recovery has been fault-injected successfully. `shellcheck -P ..` is used from the CI app directory to resolve the shared Bash helper source.

Before replacing either slot, a release verifies that the recorded stable process and current HTTPS routing agree. This also prevents a rerun from recreating a candidate still serving traffic after an incomplete rollback. If that check fails, reconcile the live routing and stable state first; a new release is not treated as proof that the previous rollback succeeded.
