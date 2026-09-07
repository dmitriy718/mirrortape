# Deployment on codexstore@65.75.201.59

The inspected VPS runs Ubuntu 24.04, Caddy 2.11.4, Docker Compose and other production applications. Host Node is 20. MirrorTape therefore uses isolated Node 24 application containers and its own PostgreSQL 16 container and volume. No host Node upgrade or CodexStore database migration is required.

Files: `app/Dockerfile`, `deploy/compose.yml`, `deploy/provision-vps.py`, `deploy/vps-release.sh`. The source checkout is `/srv/mirrortape/source`; secrets are root-owned mode 0600 under `/etc/mirrortape`. Application slots bind only `127.0.0.1:3101` and `127.0.0.1:3102`. The dedicated Docker subnet is `172.30.77.0/24`, checked against existing VPS networks. Only its host gateway is trusted for reverse-proxy IP headers. PostgreSQL has no published host port.

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

Later releases build an immutable commit-tagged image, create/validate a pre-migration backup, run the additive migrations, start the inactive application slot and check readiness. Caddy is validated and reloaded only after candidate health succeeds. HTTPS must report the expected release within 30 seconds; otherwise routing is restored and the failed candidate is stopped. The database is never rolled back over new writes. Previous application images, assets and backup archives remain available; no volume or backup pruning is performed.

The earlier systemd/host-Node release scripts remain alternative deployment definitions. Do not run them on this Docker installation. The GitHub manual release workflow must use `vps-release.sh` for this host.

## Operational checks

```bash
sudo docker compose --env-file /etc/mirrortape/releases.env -f /srv/mirrortape/source/deploy/compose.yml ps
curl --fail https://mirrortape.net/health/ready
sudo journalctl -u caddy --since '15 minutes ago'
```

Never print `docker compose config` or container environment inspection output: they can contain secrets. Use `docker compose config --quiet` for validation. Backups live under `/srv/mirrortape/backups` with restricted access. Off-site backup retention, SMTP delivery, social-provider configuration and public TLS checks are separate operational requirements.
