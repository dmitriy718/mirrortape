#!/usr/bin/env bash
# Source-only helpers. No state is changed on import.
release_health() {
  local url=$1 commit=$2 budget=${3:-30} deadline remaining result
  [[ "$commit" =~ ^[a-f0-9]{40}$ && "$budget" =~ ^[0-9]+$ ]] || return 1
  ((budget>=1 && budget<=30)) || return 1
  deadline=$((SECONDS+budget))
  while ((SECONDS<deadline)); do
    remaining=$((deadline-SECONDS))
    ((remaining>2)) && remaining=2
    result=$(curl --fail --silent --max-time "$remaining" "$url") || result=''
    if printf '%s' "$result" | python3 -c 'import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get("status")=="ready" and d.get("release")==sys.argv[1] else 1)' "$commit" 2>/dev/null; then return 0; fi
    ((SECONDS<deadline)) && sleep 1
  done
  return 1
}
release_https_health() {
  local commit=$1 deadline result
  deadline=$((SECONDS+30))
  while ((SECONDS<deadline)); do
    result=$(curl --fail --silent --max-time 2 --resolve mirrortape.net:443:127.0.0.1 https://mirrortape.net/health/ready) || result=''
    if printf '%s' "$result" | python3 -c 'import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get("status")=="ready" and d.get("release")==sys.argv[1] else 1)' "$commit" 2>/dev/null; then return 0; fi
    sleep 1
  done
  return 1
}
release_restore_routing() {
  local backup=$1 mapping=$2 caddy_config=$3 temporary
  [[ -f "$backup" ]] || return 1
  temporary=$(mktemp "${mapping}.rollback.XXXXXX") || return 1
  cp "$backup" "$temporary" && chmod 0644 "$temporary" && mv "$temporary" "$mapping" || return 1
  caddy validate --config "$caddy_config" && systemctl reload caddy
}
