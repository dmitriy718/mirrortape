#!/usr/bin/env bash
set -uo pipefail
umask 077
repo=${1:-}
mode=${2:---check}
dns_mode=${3:---require-https}
root=/srv/mirrortape
config=/etc/mirrortape
slot=''
old_slot=''
old_commit=''
old_config=''
started=false
switched=false
mapping_backup=''
log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }
fail() { log "ERROR: $*" >&2; exit 1; }
run() { "$@" || fail "Command failed: $1"; }
compose() { docker compose --env-file "$config/releases.env" -f "$repo/deploy/compose.yml" "$@"; }
health() {
  local port=$1 commit=$2 deadline result
  deadline=$((SECONDS+30))
  while ((SECONDS<deadline)); do
    result=$(curl --fail --silent --max-time 2 "http://127.0.0.1:$port/health/ready") || result=''
    if printf '%s' "$result" | python3 -c 'import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get("status")=="ready" and d.get("release")==sys.argv[1] else 1)' "$commit" 2>/dev/null; then return 0; fi
    sleep 1
  done
  return 1
}
cleanup() {
 local result=$?
 if ((result!=0)); then
  if [[ "$switched" == true ]]; then
   log 'Restoring previous Caddy routing.'
   if [[ -f "$mapping_backup" ]] && install -m 0644 "$mapping_backup" "$config/upstream.caddy" && caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy; then
    log 'Previous routing restored.'
    if [[ -n "$old_slot" ]]; then
     local previous_port=3101
     [[ "$old_slot" == green ]] && previous_port=3102
     health "$previous_port" "$old_commit" || log 'CRITICAL: previous release readiness failed after rollback.'
    fi
   else log 'CRITICAL: routing rollback failed. Inspect Caddy immediately.'; fi
  fi
  if [[ "$started" == true ]]; then compose stop "app-$slot" || log 'WARNING: failed candidate needs inspection'; fi
  log 'Release failed; database, images and backups retained.'
 fi
 exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
[[ -d "$repo/.git" ]] || fail 'Provide the clean MirrorTape source checkout.'
[[ "$mode" == '--check' || "$mode" == '--apply' ]] || fail 'Use --check or --apply.'
[[ "$dns_mode" == '--require-https' || "$dns_mode" == '--await-dns' ]] || fail 'Use --require-https or --await-dns.'
for tool in docker git curl python3 caddy systemctl flock install sha256sum; do command -v "$tool" >/dev/null || fail "Missing tool: $tool"; done
[[ $EUID -eq 0 ]] || fail 'Use the provisioned root deployment operator.'
run docker info --format '{{.ServerVersion}}'
run docker compose version
[[ -z $(git --no-optional-locks -c safe.directory="$repo" -C "$repo" status --porcelain) ]] || fail 'Source checkout contains uncommitted changes.'
commit=$(git -c safe.directory="$repo" -C "$repo" rev-parse HEAD) || fail 'Commit unavailable.'
[[ "$commit" =~ ^[a-f0-9]{40}$ ]] || fail 'Invalid commit.'
for file in app.env postgres.env releases.env upstream.caddy; do [[ -f "$config/$file" ]] || fail "Provision $config/$file first."; done
[[ $(stat -c '%a' "$config/app.env") == 600 && $(stat -c '%a' "$config/postgres.env") == 600 ]] || fail 'Secret files must use mode 0600.'
config_hash=$(sha256sum "$config/app.env" | cut -d ' ' -f 1) || fail 'Cannot fingerprint application configuration.'
run compose config --quiet
run caddy validate --config /etc/caddy/Caddyfile
if [[ "$mode" == '--check' ]]; then log 'Read-only container/proxy preflight passed.'; exit 0; fi
exec 9>"$root/deploy.lock"
flock -n 9 || fail 'A deployment is already running.'
if [[ -f "$root/current" ]]; then
 read -r old_slot old_commit old_config < "$root/current" || fail 'Cannot read previous release.'
 [[ "$old_slot" =~ ^(blue|green)$ && "$old_commit" =~ ^[a-f0-9]{40}$ ]] || fail 'Invalid previous state.'
 [[ "$dns_mode" != '--await-dns' ]] || fail '--await-dns is restricted to first installation.'
fi
if [[ "$old_slot" == blue ]]; then slot=green; port=3102; else slot=blue; port=3101; fi
if [[ "$old_commit" == "$commit" && "$old_config" == "$config_hash" ]]; then
 if [[ "$old_slot" == blue ]]; then port=3101; else port=3102; fi
 health "$port" "$commit" || fail 'Existing release is unhealthy.'
 log 'This exact release is already installed and healthy.'; exit 0
fi
[[ $(df -Pk "$root" | awk 'NR==2{print $4}') -ge 4194304 ]] || fail 'At least 4 GiB of disk space is required.'
image="mirrortape/app:$commit"
run docker build --pull --build-arg "RELEASE_COMMIT=$commit" -t "$image" "$repo/app"
run docker run --rm --network none --env-file "$config/app.env" "$image" node --input-type=module -e 'import {readConfig} from "./server-dist/config.js";readConfig();console.log("Production configuration validated without revealing values.")'
# Replace only the inactive image reference; the active service remains untouched.
run python3 - "$config/releases.env" "$slot" "$image" "$commit" <<'PY'
import sys,os,tempfile
path,slot,image,commit=sys.argv[1:]
values=dict(line.strip().split('=',1) for line in open(path) if '=' in line)
values['IMAGE_'+slot.upper()]=image; values['RELEASE_'+slot.upper()]=commit
fd,tmp=tempfile.mkstemp(dir=os.path.dirname(path))
with os.fdopen(fd,'w') as f:f.write(''.join(f'{k}={v}\n' for k,v in values.items()))
os.chmod(tmp,0o600);os.replace(tmp,path)
PY
run compose up -d --wait --wait-timeout 120 database
backup="$root/backups/$(date -u +%Y%m%dT%H%M%SZ)-$commit.dump"
(set -o noclobber; compose exec -T database pg_dump -U mirrortape -d mirrortape --format=custom --no-owner --no-acl > "$backup") || fail 'Database backup failed; no migration was attempted.'
[[ -s "$backup" ]] || fail 'Backup is empty.'
compose exec -T database pg_restore --list < "$backup" >/dev/null || fail 'Backup archive validation failed.'
run compose run --rm --no-deps "app-$slot" node server-dist/migrate.js
started=true
run compose up -d --no-deps "app-$slot"
health "$port" "$commit" || fail 'Candidate failed its 30-second readiness check.'
# Preserve hashed assets for tabs opened on the previous release.
run install -d -m 0755 "$root/shared/assets"
asset_container=$(docker create "$image") || fail 'Could not open candidate assets.'
if ! docker cp "$asset_container:/app/dist/assets/." "$root/shared/assets/"; then docker rm "$asset_container" >/dev/null; fail 'Could not retain frontend assets.'; fi
run docker rm "$asset_container"
run chmod -R a+rX "$root/shared"
mapping_backup="$root/backups/$(date -u +%Y%m%dT%H%M%SZ)-upstream.caddy"
run cp "$config/upstream.caddy" "$mapping_backup"
proposal=$(mktemp "$config/upstream.XXXXXX") || fail 'Could not stage proxy mapping.'
printf 'reverse_proxy 127.0.0.1:%s\n' "$port" > "$proposal" || fail 'Could not write mapping.'
run chmod 0644 "$proposal"
run mv "$proposal" "$config/upstream.caddy"
switched=true
run caddy validate --config /etc/caddy/Caddyfile
run systemctl reload caddy
if [[ "$dns_mode" == '--require-https' ]]; then
 deadline=$((SECONDS+30)); https_ok=false
 while ((SECONDS<deadline)); do
  result=$(curl --fail --silent --max-time 2 --resolve mirrortape.net:443:127.0.0.1 https://mirrortape.net/health/ready) || result=''
  if printf '%s' "$result" | python3 -c 'import json,sys;d=json.load(sys.stdin);sys.exit(0 if d.get("status")=="ready" and d.get("release")==sys.argv[1] else 1)' "$commit" 2>/dev/null; then https_ok=true; break; fi
  sleep 1
 done
 [[ "$https_ok" == true ]] || fail 'Routed HTTPS health failed.'
else
 log 'DNS staging mode: candidate health verified; public HTTPS is pending DNS and certificate issuance.'
fi
state=$(mktemp "$root/current.XXXXXX") || fail 'Could not stage release state.'
printf '%s %s %s\n' "$slot" "$commit" "$config_hash" > "$state" || fail 'Could not write release state.'
run mv "$state" "$root/current"
switched=false
if [[ -n "$old_slot" ]]; then compose stop "app-$old_slot" || log 'WARNING: previous service still needs draining'; fi
log "Installed $commit in $slot; backup: $backup. Production provider credentials are managed separately."
