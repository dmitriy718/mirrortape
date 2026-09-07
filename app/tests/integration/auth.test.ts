import { afterAll, beforeAll, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { readConfig } from "../../server/config";
import { database } from "../../server/db";
import { migrate } from "../../server/migrations";
import { buildApp } from "../../server/app";
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
const config = { ...readConfig(), SMTP_URL: undefined, MAIL_FROM: undefined };
if (
  config.NODE_ENV !== "test" ||
  !new URL(config.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Use a dedicated test database");
const db = database(config);
const app = await buildApp({ config, db }, false);
beforeAll(async () => {
  await migrate(db);
  await app.ready();
  await db.query("DELETE FROM rate_windows");
});
afterAll(async () => {
  await app.close();
});
it("signup and returning-client login work without claiming email delivery when SMTP is absent", async () => {
  const guest = await app.inject({ url: "/api/session" });
  const oldCookie = guest.headers["set-cookie"]!.toString().split(";")[0];
  const email = `no-smtp-${randomUUID()}@example.test`,
    password = "a long isolated test password";
  const created = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    headers: {
      cookie: oldCookie,
      origin: config.APP_ORIGIN,
      "x-csrf-token": guest.json().csrf,
    },
    payload: { email, password, website: "" },
  });
  expect(created.statusCode).toBe(200);
  expect(created.json()).toMatchObject({
    created: true,
    verificationAvailable: false,
  });
  expect(created.json().message).not.toMatch(/will arrive/);
  const accountCookie = created.headers["set-cookie"]!.toString().split(";")[0];
  expect(accountCookie).not.toBe(oldCookie);
  const session = await app.inject({
    url: "/api/session",
    headers: { cookie: accountCookie },
  });
  expect(session.json().user).toMatchObject({
    authenticated: true,
    verified: false,
    email,
  });
  expect(
    (
      await app.inject({
        url: "/api/watchlist",
        headers: { cookie: accountCookie },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        url: "/api/watchlist",
        headers: { cookie: oldCookie },
      })
    ).statusCode,
  ).toBe(401);
  expect(
    (await db.query("SELECT 1 FROM email_outbox WHERE recipient=$1", [email]))
      .rowCount,
  ).toBe(0);
  const returning = await app.inject({ url: "/api/session" });
  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    headers: {
      cookie: returning.headers["set-cookie"]!.toString().split(";")[0],
      origin: config.APP_ORIGIN,
      "x-csrf-token": returning.json().csrf,
    },
    payload: { email, password, website: "" },
  });
  expect(login.statusCode).toBe(200);
  const signedIn = await app.inject({
    url: "/api/session",
    headers: { cookie: login.headers["set-cookie"]!.toString().split(";")[0] },
  });
  expect(signedIn.json().user.id).toBe(session.json().user.id);
  expect(signedIn.json().user.authenticated).toBe(true);
});
