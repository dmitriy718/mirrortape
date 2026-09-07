#!/usr/bin/env python3
"""Provision only MirrorTape-owned files; never replace existing secrets or sites."""
import datetime
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import tempfile

ROOT = Path('/srv/mirrortape')
CONFIG = Path('/etc/mirrortape')
SITE = Path('/etc/caddy/sites/mirrortape.caddy')


def log(message):
    print(f'{datetime.datetime.now(datetime.timezone.utc).isoformat()} {message}', flush=True)


def run(*args):
    subprocess.run(args, check=True)


def write(path, content, mode):
    with path.open('x') as stream:
        stream.write(content)
    path.chmod(mode)


def main():
    if os.geteuid() != 0 or len(sys.argv) != 2:
        raise RuntimeError('Run as root with the clean source checkout path.')
    repo = Path(sys.argv[1]).resolve()
    for tool in ('docker', 'caddy', 'git'):
        if not shutil.which(tool):
            raise RuntimeError(f'Missing prerequisite: {tool}')
    commit = subprocess.check_output(['git', '-c', f'safe.directory={repo}', '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip()
    if len(commit) != 40 or any(c not in '0123456789abcdef' for c in commit):
        raise RuntimeError('Invalid release commit.')
    if subprocess.check_output(['git', '--no-optional-locks', '-c', f'safe.directory={repo}', '-C', str(repo), 'status', '--porcelain'], text=True).strip():
        raise RuntimeError('Source must be clean.')
    caddyfile = Path('/etc/caddy/Caddyfile')
    if 'import /etc/caddy/sites/*.caddy' not in caddyfile.read_text():
        raise RuntimeError('Expected existing Caddy site import is missing; inspect before proceeding.')
    ROOT.mkdir(mode=0o755, parents=True, exist_ok=True)
    for name, mode in (('backups', 0o700), ('shared', 0o755)):
        target = ROOT / name
        target.mkdir(mode=mode, exist_ok=True)
        if target.is_symlink():
            raise RuntimeError(f'Refusing symlink: {target}')
        target.chmod(mode)
    if CONFIG.is_symlink():
        raise RuntimeError('Refusing symlinked configuration directory.')
    if not CONFIG.exists():
        # Stage the complete bundle on the same filesystem, then publish atomically.
        staged = Path(tempfile.mkdtemp(prefix='.mirrortape-stage-', dir='/etc'))
        password = secrets.token_hex(32)
        write(staged / 'postgres.env', f'POSTGRES_USER=mirrortape\nPOSTGRES_DB=mirrortape\nPOSTGRES_PASSWORD={password}\n', 0o600)
        write(staged / 'app.env', 'NODE_ENV=production\nAPP_ORIGIN=https://mirrortape.net\n'
              f'DATABASE_URL=postgresql://mirrortape:{password}@database:5432/mirrortape\n'
              f'SESSION_SECRET={secrets.token_hex(48)}\nENCRYPTION_KEY={secrets.token_hex(32)}\n'
              'BILLING_ENABLED=false\nALPACA_COMMERCIAL_APPROVED=false\nCOHORT_CAPACITY=0\n', 0o600)
        write(staged / 'releases.env', ''.join(f'IMAGE_{slot}=mirrortape/app:{commit}\nRELEASE_{slot}={commit}\n' for slot in ('BLUE', 'GREEN')), 0o600)
        write(staged / 'upstream.caddy', 'respond "MirrorTape is being prepared. Please return shortly." 503\n', 0o644)
        staged.chmod(0o755)
        staged.rename(CONFIG)
        log('Created isolated configuration and fresh secrets; values were not printed.')
    else:
        for name in ('app.env', 'postgres.env', 'releases.env', 'upstream.caddy'):
            path = CONFIG / name
            if not path.is_file() or path.is_symlink():
                raise RuntimeError(f'Existing configuration is incomplete or unsafe: {name}; preserved for inspection.')
        log('Existing configuration retained without modifying secrets.')
    expected = (repo / 'deploy/mirrortape.caddy').read_text().replace('/etc/caddy/mirrortape-upstream.caddy', '/etc/mirrortape/upstream.caddy')
    if SITE.exists():
        if SITE.is_symlink() or SITE.read_text() != expected:
            raise RuntimeError('Existing MirrorTape Caddy site differs; inspect and back up before changing it.')
        log('Existing matching site retained.')
    else:
        backup = ROOT / 'backups' / f'Caddyfile-{datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")}'
        write(backup, caddyfile.read_text(), 0o600)
        run('caddy', 'validate', '--config', str(caddyfile))
        write(SITE, expected, 0o644)
        try:
            run('caddy', 'validate', '--config', str(caddyfile))
        except subprocess.CalledProcessError:
            SITE.rename(ROOT / 'backups' / f'rejected-site-{secrets.token_hex(8)}')
            raise RuntimeError('Site validation failed; new site moved to backups. Running Caddy was not reloaded.') from None
        log('New site validated. Existing sites preserved; reload belongs to the health-checked release.')
    log('Provisioning complete. Run vps-release.sh --check, then the authorized release.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        log(f'FAILED: {error}')
        sys.exit(1)
