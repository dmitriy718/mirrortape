# MirrorTape application

The React/TypeScript frontend, Fastify API and PostgreSQL migrations live here. See the [repository README](../README.md) for setup and environment configuration, [verification report](../docs/VERIFICATION.md) for test evidence and limitations, and [VPS runbook](../deploy/README.md) for release operations.

Run `npm run check` after configuring the isolated test database. Run `npm run build && npm start` for the full local application at http://127.0.0.1:3100.

Public company/policy pages and journal articles are documented in [PUBLIC_SITE.md](../docs/PUBLIC_SITE.md). `npm run build` generates complete public HTML, sitemap and RSS in addition to the client and API bundles. All production build steps use `NODE_ENV=production`; `.env` is not a build-mode switch. Serve with the Fastify runtime for correct route status, cache and security headers, rather than treating `vite preview` as the deployment server.
