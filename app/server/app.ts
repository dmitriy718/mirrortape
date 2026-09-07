import { publicSite } from "./public-site.js";
import Fastify from "fastify";
import formbody from "@fastify/formbody";
import { providerAvailable } from "./auth/social-providers.js";
import { socialRoutes } from "./routes/social.js";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import assets from "@fastify/static";
import { resolve } from "node:path";
import { ZodError } from "zod";
import type { Context } from "./types.js";
import { security } from "./security.js";
import { AppError } from "./errors.js";
import { workspaceRoutes } from "./routes/workspace.js";
import { authRoutes } from "./routes/auth.js";
import { providerRoutes } from "./routes/providers.js";
import { billingRoutes } from "./routes/billing.js";
import { jobs } from "./jobs.js";
export async function buildApp(ctx: Context, backgroundJobs = true) {
  const app = Fastify({
    bodyLimit: 32768,
    requestTimeout: 15000,
    connectionTimeout: 15000,
    keepAliveTimeout: 5000,
    trustProxy:
      ctx.config.TRUST_PROXY_ADDRESS ??
      (ctx.config.TRUST_PROXY === "loopback" ? "loopback" : false),
    logger: {
      serializers: {
        req: (r) => ({ method: r.method, path: r.url?.split("?")[0] }),
      },
      level: ctx.config.NODE_ENV === "test" ? "silent" : "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body",
        'res.headers["set-cookie"]',
      ],
    },
  });
  await app.register(cookie);
  await app.register(formbody);
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests:
          ctx.config.NODE_ENV === "production" ? [] : null,
      },
    },
    hsts:
      ctx.config.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: false }
        : false,
    referrerPolicy: { policy: "no-referrer" },
    crossOriginEmbedderPolicy: false,
  });
  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()",
    );
    return payload;
  });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send({
        error: {
          code: "VALIDATION",
          message:
            "Some information is missing or not in the expected format. Check the highlighted fields and try again.",
          fields: [...new Set(error.issues.map((i) => i.path.join(".")))],
          requestId: request.id,
        },
      });
      return;
    }
    if (error instanceof AppError) {
      if (error.retryAfter) reply.header("Retry-After", error.retryAfter);
      reply.code(error.status).send({
        error: {
          code: error.code,
          message: error.message,
          requestId: request.id,
        },
      });
      return;
    }
    const known = error as { code?: string; statusCode?: number };
    if (known.code === "23505") {
      reply.code(409).send({
        error: {
          code: "CONFLICT",
          message:
            "This change overlaps an existing record. Refresh and try again.",
          requestId: request.id,
        },
      });
      return;
    }
    if (known.statusCode === 413) {
      reply.code(413).send({
        error: {
          code: "TOO_LARGE",
          message: "This message is too long. Shorten it and try again.",
        },
      });
      return;
    }
    if (known.statusCode === 400 || known.statusCode === 415) {
      reply.code(known.statusCode).send({
        error: {
          code: "INVALID_REQUEST",
          message:
            "We could not read this request. Refresh the page and try again.",
        },
      });
      return;
    }
    app.log.error(
      { requestId: request.id, errorCode: known.code ?? "INTERNAL" },
      "Request failed",
    );
    reply.code(503).send({
      error: {
        code: "TEMPORARY_FAILURE",
        message:
          "We could not complete that request right now. Your saved work is safe. Please try again.",
        requestId: request.id,
      },
    });
  });
  await security(app, ctx);
  let ready = true;
  app.get("/health/live", async () => ({
    status: "ok",
    release: ctx.config.RELEASE_ID,
  }));
  app.get("/health/ready", async (_req, reply) => {
    if (!ready) return reply.code(503).send({ status: "draining" });
    const schema = await ctx.db.query(
      "SELECT name FROM schema_migrations WHERE name=$1",
      ["002_social_auth.sql"],
    );
    if (!schema.rowCount)
      return reply.code(503).send({ status: "schema_missing" });
    return { status: "ready", release: ctx.config.RELEASE_ID };
  });
  app.get("/api/public/status", async () => {
    const schema = await ctx.db.query(
      "SELECT name FROM schema_migrations WHERE name=$1",
      ["002_social_auth.sql"],
    );
    if (!schema.rowCount)
      throw new AppError(
        503,
        "NOT_READY",
        "The workspace is not ready. Try the check again shortly.",
      );
    return {
      checkedAt: new Date().toISOString(),
      workspace: true,
      email: Boolean(ctx.config.SMTP_URL),
      billing: ctx.config.BILLING_ENABLED === "true",
      alpaca: Boolean(
        ctx.config.ALPACA_CLIENT_ID && ctx.config.ALPACA_CLIENT_SECRET,
      ),
      social: {
        google: providerAvailable(ctx.config, "google"),
        apple: providerAvailable(ctx.config, "apple"),
        facebook: providerAvailable(ctx.config, "facebook"),
      },
    };
  });
  await workspaceRoutes(app, ctx);
  await authRoutes(app, ctx);
  await socialRoutes(app, ctx);
  await providerRoutes(app, ctx);
  await billingRoutes(app, ctx);
  const site = await publicSite();
  await app.register(assets, {
    root: resolve("dist"),
    wildcard: false,
    index: false,
    globIgnore: ["**/*.html", "**/site-manifest.json"],
    setHeaders: (res, path) => {
      if (path.includes("/assets/"))
        res.header("Cache-Control", "public,max-age=31536000,immutable");
      else res.header("Cache-Control", "no-cache");
    },
  });
  const routes = new Set([
    "/",
    "/app",
    "/app/login",
    "/app/register",
    "/app/verify",
    "/app/reset",
    "/app/recover",
    "/app/resend",
    "/pricing",
    "/how-it-works",
    "/risk",
    "/faq",
    "/traders",
    "/demo",
    "/support",
  ]);
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api/"))
      return reply.code(404).send({
        error: {
          code: "NOT_FOUND",
          message: "This request is not available. Return to your workspace.",
        },
      });
    const path = (request.url.split("?")[0] ?? "").replace(/\/$/, "") || "/";
    const rendered = site.pages.get(path);
    if (rendered)
      return reply
        .code(200)
        .type("text/html; charset=utf-8")
        .header("Cache-Control", "no-cache")
        .send(rendered);
    const privatePath = path.startsWith("/app") && routes.has(path);
    reply.header("X-Robots-Tag", "noindex, nofollow");
    reply.header("Cache-Control", "no-store");
    return reply
      .code(privatePath ? 200 : 404)
      .type("text/html; charset=utf-8")
      .send(site.privateHtml);
  });
  const stopJobs = backgroundJobs ? jobs(app, ctx) : async () => {};
  app.addHook("preClose", async () => {
    ready = false;
  });
  app.addHook("onClose", async () => {
    try {
      await stopJobs();
    } finally {
      await ctx.db.end();
    }
  });
  return app;
}
