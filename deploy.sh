#!/usr/bin/env bash
set -uo pipefail
# The active VPS uses Docker blue/green releases behind Caddy.
script_dir=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd) || exit 1
if [[ ${1:-} == '--help' || ${1:-} == '-h' ]]; then
  printf '%s\n' 'Usage: sudo ./deploy.sh [--check|--apply]' 'Default: read-only preflight. Uses this clean checkout and the existing VPS configuration.'
  exit 0
fi
if (($#>1)) || [[ ${1:---check} != '--check' && ${1:---check} != '--apply' ]]; then
  printf '%s ERROR: Use --check or --apply.\n' "$(date -u +%FT%TZ)" >&2
  exit 2
fi
exec bash "$script_dir/deploy/vps-release.sh" "$script_dir" "${1:---check}"
