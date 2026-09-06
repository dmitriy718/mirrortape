#!/usr/bin/env bash
set -uo pipefail
umask 077

# Build and validate before selecting --apply. No source checkout or live DB is overwritten.
# Usage: sudo ./deploy/deploy.sh /path/to/git-checkout [commit] [--apply]
readonly release_root=/srv/mirrortape
readonly production_env=/etc/mirrortape/app.env
readonly upstream=/etc/caddy/mirrortape-upstream.caddy
readonly caddy_config=/etc/caddy/Caddyfile
readonly stable_state=/srv/mirrortape/stable-release
repo=${1:-}
revision=${2:-HEAD}
mode=${3:---check}
candidate=''
candidate_started=false
switched=false
previous_release=''
previous_port=''
backup_upstream=''
staging_dir=''

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }
fail() { log "ERROR: $*" >&2; exit 1; }
command_exists() { command -v "$1" >/dev/null 2>&1; }
run() { "$@" || fail "Command failed: $1. See preceding output; no success is assumed."; }
atomic_copy() {
  local src=$1 dst=$2 temporary
  temporary=$(mktemp "${dst}.XXXXXX") || return 1
  cp "$src" "$temporary" && chmod 0644 "$temporary" && mv -f "$temporary" "$dst"
}
health() {
  local url=$1 expected=$2 result deadline
  deadline=$((SECONDS + 30))
  while ((SECONDS < deadline)); do
    result=$(curl --fail --silent --max-time 2 "$url" 2>/dev/null) || result=''
    if [[ -n "$result" ]] && printf '%s' "$result" | /usr/bin/node -e '
      let s="";process.stdin.on("data",v=>s+=v);process.stdin.on("end",()=>{try{const r=JSON.parse(s);process.exit(r.status==="ready"&&r.release===process.argv[1]?0:1)}catch{process.exit(1)}});
    ' "$expected"; then return 0; fi
    sleep 1
  done
  return 1
}
cleanup() {
  local status=$?
  if ((status != 0)); then
    if [[ "$switched" == true ]]; then
      log 'Restoring the previous verified proxy mapping.'
      if [[ -n "$backup_upstream" && -f "$backup_upstream" ]]; then
        if atomic_copy "$backup_upstream" "$upstream" && caddy validate --config "$caddy_config" && systemctl reload caddy; then
          if [[ -n "$previous_release" ]] && health "http://127.0.0.1:${previous_port}/health/ready" "$previous_release" && health 'https://mirrortape.net/health/ready' "$previous_release"; then
            log "Rollback verified: ${previous_release}. Database was not restored over current writes."
          else log 'CRITICAL: rollback mapping restored but previous release health is unverified. Operator action required.'; fi
        else log 'CRITICAL: automatic proxy rollback failed. Keep the previous service running and inspect Caddy.'; fi
      else log 'CRITICAL: no previous upstream backup. Inspect the proxy before resuming traffic.'; fi
    fi
    if [[ "$candidate_started" == true ]]; then systemctl stop "mirrortape@${candidate}" || log 'WARNING: candidate service could not be stopped'; fi
    log 'Release failed. Existing releases, database and backup artifacts have been preserved.'
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

[[ -n "$repo" && -d "$repo/.git" ]] || fail 'Provide the path to a Git checkout.'
[[ "$mode" == '--check' || "$mode" == '--apply' ]] || fail 'Mode must be --check or --apply.'
for tool in git node npm curl caddy systemctl pg_dump pg_restore flock tar sha256sum mktemp install; do command_exists "$tool" || fail "Required tool missing: $tool"; done
[[ -x /usr/bin/node ]] || fail 'systemd runner expects /usr/bin/node; install or adjust the service and script explicitly.'
[[ $(/usr/bin/node -p 'process.versions.node.split(".")[0]') == 24 ]] || fail 'This release requires tested Node 24 LTS.'
[[ -f "$production_env" && -f "$caddy_config" ]] || fail 'Provision the production environment and existing Caddy configuration first.'
[[ $(stat -c '%a' "$production_env") == 600 ]] || fail 'Production environment file must have mode 0600.'
[[ -z $(git -C "$repo" status --porcelain) ]] || fail 'Deploy only a clean committed checkout.'
commit=$(git -C "$repo" rev-parse --verify "${revision}^{commit}") || fail 'Release commit is invalid.'
[[ "$commit" =~ ^[a-f0-9]{40}$ ]] || fail 'Invalid commit identifier.'
candidate="${commit:0:12}-$(date -u +%Y%m%d%H%M%S)"
log "Validating release ${candidate} for mirrortape.net (${mode})."
if [[ -f "$stable_state" ]]; then
  read -r previous_release previous_port < "$stable_state" || fail 'Cannot read stable release state.'
  [[ "$previous_release" =~ ^[a-f0-9]{12}-[0-9]{14}$ && "$previous_port" =~ ^31(01|02)$ ]] || fail 'Stable release state is invalid.'
  [[ -d "$release_root/releases/$previous_release" && -f "$upstream" ]] || fail 'Previous stable release files are missing.'
fi
if [[ "$previous_port" == 3101 ]]; then candidate_port=3102; else candidate_port=3101; fi
[[ $(df -Pk "$release_root" 2>/dev/null | awk 'NR==2{print $4}') -ge 2097152 ]] || fail 'At least 2 GiB free space is required before building and backing up.'
run caddy validate --config "$caddy_config"
# Validation uses Node's env-file parser, never shell sourcing or credential interpolation.
run /usr/bin/node --env-file="$production_env" -e '
 const required=["DATABASE_URL","SESSION_SECRET","ENCRYPTION_KEY","APP_ORIGIN","NODE_ENV"];
 const missing=required.filter(k=>!process.env[k]);if(missing.length){console.error("Missing configuration names: "+missing.join(", "));process.exit(1)}
 if(process.env.NODE_ENV!=="production"||process.env.APP_ORIGIN!=="https://mirrortape.net"){console.error("Production origin/environment mismatch");process.exit(1)}
'
if [[ "$mode" == '--check' ]]; then log 'Read-only preflight passed. Use --apply after reviewing configuration and the release commit. No deployment or backup was performed.'; exit 0; fi
[[ $EUID -eq 0 ]] || fail '--apply requires the provisioned deployment operator (root for this systemd layout).'
exec 9>"$release_root/deploy.lock"
flock -n 9 || fail 'Another deployment is running.'
# Re-read the active state under the lock to prevent a stale candidate-port decision.
if [[ -f "$stable_state" ]]; then
  read -r locked_release locked_port < "$stable_state" || fail 'Cannot read locked release state.'
  [[ "$locked_release" == "$previous_release" && "$locked_port" == "$previous_port" ]] || fail 'Stable release changed during preflight; rerun deployment.'
fi
if [[ -n "$previous_release" ]]; then health "http://127.0.0.1:${previous_port}/health/ready" "$previous_release" || fail 'Previous release is unhealthy; resolve before deployment.'; fi
if systemctl is-active --quiet "mirrortape@${candidate}"; then fail 'Candidate identifier is already running.'; fi
run install -d -m 0755 "$release_root/releases" "$release_root/shared/assets" /etc/mirrortape/instances
run install -d -m 0700 "$release_root/backups"
staging_dir="$release_root/releases/$candidate"
run install -d -m 0755 "$staging_dir"
git -C "$repo" archive "$commit" | tar -x -C "$staging_dir" || fail 'Could not extract immutable release.'
cd "$staging_dir/app" || fail 'Release app directory missing.'
# Build dependencies are needed only in this staging directory; they never modify the live release.
run npm ci --ignore-scripts
run npm run lint
run npm run build
run npm audit --audit-level=high
run /usr/bin/node --env-file="$production_env" --input-type=module -e 'import {readConfig} from "./server-dist/config.js";readConfig();console.log("Configuration schema verified.");'
backup_file="$release_root/backups/${candidate}.dump"
run /usr/bin/node --env-file="$production_env" scripts/backup-db.mjs "$backup_file"
run /usr/bin/node --env-file="$production_env" server-dist/migrate.js
# Runtime contains production dependencies only; build artifacts are already complete.
run npm ci --omit=dev --ignore-scripts
run cp -a dist/assets/. "$release_root/shared/assets/"
run chown -R mirrortape:mirrortape "$staging_dir"
run chmod -R o-rwx "$staging_dir"
# Parent directories remain traversable; Caddy reads only the separate shared assets.
printf 'PORT=%s\nHOST=127.0.0.1\nRELEASE_ID=%s\n' "$candidate_port" "$candidate" > "/etc/mirrortape/instances/${candidate}.env" || fail 'Could not write instance environment.'
run chmod 0600 "/etc/mirrortape/instances/${candidate}.env"
run systemctl start "mirrortape@${candidate}"
candidate_started=true
health "http://127.0.0.1:${candidate_port}/health/ready" "$candidate" || fail 'Candidate did not become healthy within 30 seconds.'
run curl --fail --silent --max-time 5 --output /dev/null "http://127.0.0.1:${candidate_port}/"
if [[ -f "$upstream" ]]; then
  backup_upstream="$release_root/backups/${candidate}-upstream.caddy"
  run cp "$upstream" "$backup_upstream"
else fail 'Provision an initial maintenance upstream before the first release; it is the rollback boundary.'; fi
proposal="$release_root/backups/${candidate}-candidate.caddy"
cat > "$proposal" <<PROXY
reverse_proxy 127.0.0.1:${candidate_port} {
    transport http {
        dial_timeout 5s
        response_header_timeout 20s
    }
}
PROXY
atomic_copy "$proposal" "$upstream" || fail 'Could not stage candidate upstream.'
switched=true
run caddy validate --config "$caddy_config"
run systemctl reload caddy
health 'https://mirrortape.net/health/ready' "$candidate" || fail 'Routed health failed within 30 seconds.'
run systemctl enable "mirrortape@${candidate}"
state_temp=$(mktemp "$release_root/stable-release.XXXXXX") || fail 'Could not stage stable state.'
printf '%s %s\n' "$candidate" "$candidate_port" > "$state_temp" || fail 'Could not write stable state.'
run mv -f "$state_temp" "$stable_state"
switched=false
if [[ -n "$previous_release" ]]; then
  if systemctl stop "mirrortape@${previous_release}" && systemctl disable "mirrortape@${previous_release}"; then log "Previous release ${previous_release} drained and retained for rollback."; else log 'WARNING: previous service cleanup needs operator attention; candidate is healthy.'; fi
fi
log "Release verified: ${candidate}; HTTPS health passed; backup ${backup_file}; previous ${previous_release:-maintenance}."
