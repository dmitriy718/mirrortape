import { afterAll, beforeAll, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { readConfig } from "../../server/config";
import { database } from "../../server/db";
import { migrate } from "../../server/migrations";
import { buildApp } from "../../server/app";
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
const config = readConfig();
if (
  config.NODE_ENV !== "test" ||
  !new URL(config.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Dedicated test database required");
const db = database(config),
  app = await buildApp({ config, db }, false);
beforeAll(async () => {
  await migrate(db);
  await app.ready();
  await db.query("DELETE FROM rate_windows");
});
afterAll(async () => app.close());
it("serves every published page as complete HTML with a specific canonical URL", async () => {
  const manifest = JSON.parse(readFileSync("dist/site-manifest.json", "utf8"));
  expect(Object.keys(manifest)).toHaveLength(23);
  for (const path of Object.keys(manifest)) {
    const r = await app.inject({ url: path });
    expect(r.statusCode, path).toBe(200);
    expect(r.body, path).toContain("<h1");
    expect(r.body, path).toContain("625 Technologies Inc.");
    expect(r.body, path).toContain(`href="https://mirrortape.net${path}"`);
    expect(r.body, path).not.toContain("data-msg=");
    expect(r.body, path).not.toMatch(/<script(?![^>]*src=)[^>]*>/);
  }
});
it("publishes valid discoverability endpoints and excludes account routes and internal artifacts", async () => {
  const sitemap = await app.inject({ url: "/sitemap.xml" });
  expect(sitemap.statusCode).toBe(200);
  expect(sitemap.body).toContain("/blog/a-watchlist-with-a-purpose");
  expect(sitemap.body).not.toContain("/app");
  const feed = await app.inject({ url: "/feed.xml" });
  expect(feed.statusCode).toBe(200);
  expect(feed.body.match(/<item>/g)).toHaveLength(4);
  expect((await app.inject({ url: "/robots.txt" })).body).toContain(
    "Disallow: /app",
  );
  for (const path of [
    "/unknown-page",
    "/blog/missing",
    "/_pages/0.html",
    "/site-manifest.json",
  ]) {
    const r = await app.inject({ url: path });
    expect(r.statusCode).toBe(404);
    expect(r.headers["x-robots-tag"]).toContain("noindex");
  }
  const auth = await app.inject({ url: "/app/login" });
  expect(auth.statusCode).toBe(200);
  expect(auth.headers["cache-control"]).toBe("no-store");
  expect(auth.headers["x-robots-tag"]).toContain("noindex");
});
it("public status reports actual feature gates without creating an account session", async () => {
  const r = await app.inject({ url: "/api/public/status" });
  expect(r.statusCode).toBe(200);
  expect(r.headers["set-cookie"]).toBeUndefined();
  expect(r.headers["cache-control"]).toBe("no-store");
  expect(r.json()).toMatchObject({
    workspace: true,
    email: Boolean(config.SMTP_URL),
    billing: config.BILLING_ENABLED === "true",
    social: { google: false, apple: false, facebook: false },
  });
  expect(r.body).not.toContain(config.SESSION_SECRET);
});
