# Production planning audit — September 6, 2026

These are baseline observations, not post-remediation results.

- `npm run build`: passed, with browser-data, CSS utility and bundle-size warnings. [Output](build.txt)
- `npm run lint`: failed, 17 errors. [Output](lint.txt)
- `npm audit --json`: 16 reported vulnerable packages (12 high, 2 moderate, 2 low). [Report](dependency-audit.json)
- `npm audit --omit=dev --json`: one high finding, lodash. [Report](runtime-dependency-audit.json)

The commands were run from `app/`. An audit finding is not a demonstrated exploit. Findings require dependency-path/reachability review and remediation verification. No Playwright, provider integration or VPS deployment verification has occurred in this planning phase.
