import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { readConfig } from "../../server/config";
import { database } from "../../server/db";
import { migrate } from "../../server/migrations";
import { buildApp } from "../../server/app";
import { slidingLimit } from "../../server/security";
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
const config = readConfig();
if (
  config.NODE_ENV !== "test" ||
  !new URL(config.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Refusing tests outside a dedicated test database");
const db = database(config);
const app = await buildApp({ config, db }, false);
beforeAll(async () => {
  await migrate(db);
  await app.ready();
});
afterAll(async () => {
  await app.close();
});
beforeEach(async () => {
  await db.query("DELETE FROM rate_windows");
});
async function account() {
  const r = await app.inject({ url: "/api/session" });
  expect(r.statusCode).toBe(200);
  const cookie = r.headers["set-cookie"]?.toString().split(";")[0] ?? "";
  await db.query("UPDATE sessions SET authenticated=true WHERE user_id=$1", [
    r.json().user.id,
  ]);
  return { cookie, session: r.json() };
}
function headers(g: Awaited<ReturnType<typeof account>>) {
  return {
    cookie: g.cookie,
    origin: config.APP_ORIGIN,
    "x-csrf-token": g.session.csrf,
  };
}
describe("real PostgreSQL API boundaries", () => {
  it("F15 requires origin and session-bound CSRF on every browser mutation", async () => {
    const g = await account();
    for (const endpoint of [
      "/api/draft",
      "/api/watchlist",
      "/api/auth/login",
      "/api/support",
      "/api/reservations",
    ]) {
      const r = await app.inject({
        method: endpoint === "/api/draft" ? "PUT" : "POST",
        url: endpoint,
        headers: { cookie: g.cookie, origin: config.APP_ORIGIN },
        payload: {},
      });
      expect(r.statusCode).toBe(403);
    }
    const other = await account();
    const r = await app.inject({
      method: "POST",
      url: "/api/watchlist",
      headers: { ...headers(g), "x-csrf-token": other.session.csrf },
      payload: { symbol: "AAPL" },
    });
    expect(r.statusCode).toBe(403);
  });
  it("F04 prevents concurrent lost updates, and scopes drafts by owner", async () => {
    const g = await account();
    const initial = (
      await app.inject({ url: "/api/draft", headers: headers(g) })
    ).json();
    const results = await Promise.all(
      ["first", "second"].map((note) =>
        app.inject({
          method: "PUT",
          url: "/api/draft",
          headers: headers(g),
          payload: { revision: 0, data: { ...initial.data, note } },
        }),
      ),
    );
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    const other = await account();
    expect(
      (await app.inject({ url: "/api/draft", headers: headers(other) })).json()
        .data.note,
    ).toBe("");
  });
  it("F11 honeypots accept neutrally without side effects", async () => {
    const g = await account();
    const r = await app.inject({
      method: "POST",
      url: "/api/watchlist",
      headers: headers(g),
      payload: { symbol: "AAPL", website: "bot.example" },
    });
    expect(r.statusCode).toBe(202);
    expect(
      (await app.inject({ url: "/api/watchlist", headers: headers(g) })).json()
        .items,
    ).toHaveLength(0);
  });
  it("F14 rejects markup, unknown keys, prototype poisoning and oversized bodies", async () => {
    const g = await account();
    for (const payload of [
      { symbol: "<script>" },
      { symbol: "AAPL", admin: true },
    ])
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/api/watchlist",
            headers: headers(g),
            payload,
          })
        ).statusCode,
      ).toBe(400);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/watchlist",
          headers: { ...headers(g), "content-type": "application/json" },
          payload: '{"__proto__":{"admin":true},"symbol":"AAPL"}',
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/support",
          headers: headers(g),
          payload: { email: "a@example.com", message: "x".repeat(40000) },
        })
      ).statusCode,
    ).toBe(413);
  });
  it("F02 enforces undo deadline and tenant isolation on the server", async () => {
    const g = await account();
    const other = await account();
    const item = (
      await app.inject({
        method: "POST",
        url: "/api/watchlist",
        headers: headers(g),
        payload: { symbol: "MSFT" },
      })
    ).json();
    const foreign = await app.inject({
      method: "DELETE",
      url: `/api/watchlist/${item.id}`,
      headers: headers(other),
      payload: {},
    });
    expect(foreign.statusCode).toBe(404);
    const removed = (
      await app.inject({
        method: "DELETE",
        url: `/api/watchlist/${item.id}`,
        headers: headers(g),
        payload: {},
      })
    ).json();
    expect(Date.parse(removed.deleteAt) - Date.now()).toBeGreaterThan(4000);
    expect(
      (
        await app.inject({
          method: "POST",
          url: `/api/watchlist/${item.id}/undo`,
          headers: headers(g),
          payload: { undoToken: removed.undoToken },
        })
      ).statusCode,
    ).toBe(200);
    const next = (
      await app.inject({
        method: "DELETE",
        url: `/api/watchlist/${item.id}`,
        headers: headers(g),
        payload: {},
      })
    ).json();
    await db.query(
      "UPDATE watchlist SET delete_at=now()-interval '1 second' WHERE id=$1",
      [item.id],
    );
    expect(
      (
        await app.inject({
          method: "POST",
          url: `/api/watchlist/${item.id}/undo`,
          headers: headers(g),
          payload: { undoToken: next.undoToken },
        })
      ).statusCode,
    ).toBe(409);
  });
  it("F12 sliding-window limits are atomic across concurrent callers and progressive", async () => {
    const key = `test:${randomUUID()}`;
    const results = await Promise.all(
      Array.from({ length: 8 }, () => slidingLimit({ db, config }, key, 3, 10)),
    );
    expect(results.filter((r) => r === 0)).toHaveLength(3);
    expect(results.filter((r) => r > 0)).toHaveLength(5);
    await db.query(
      "UPDATE rate_windows SET blocked_until=now()-interval '1 second' WHERE key=$1",
      [key],
    );
    expect(await slidingLimit({ db, config }, key, 3, 10)).toBeGreaterThan(15);
  });
  it("F12 endpoint limits return 429 and Retry-After, ignoring spoofed IP headers", async () => {
    const g = await account();
    const results = [];
    for (let i = 0; i < 17; i++)
      results.push(
        await app.inject({
          method: "POST",
          url: "/api/auth/login",
          headers: { ...headers(g), "x-forwarded-for": `1.1.1.${i}` },
          payload: { email: "nobody@example.com", password: "incorrect" },
        }),
      );
    expect(
      results.some(
        (r) => r.statusCode === 429 && Number(r.headers["retry-after"]) > 0,
      ),
    ).toBe(true);
  });
  it("F08 capacity reservations cannot oversell under concurrent requests", async () => {
    await db.query("DELETE FROM cohort_reservations");
    const guests = await Promise.all(
      Array.from({ length: 6 }, () => account()),
    );
    for (const g of guests)
      await db.query("UPDATE users SET verified=true,email=$2 WHERE id=$1", [
        g.session.user.id,
        `${randomUUID()}@example.com`,
      ]);
    const results = await Promise.all(
      guests.map((g) =>
        app.inject({
          method: "POST",
          url: "/api/reservations",
          headers: headers(g),
          payload: {},
        }),
      ),
    );
    expect(results.filter((r) => r.statusCode === 200)).toHaveLength(3);
    expect(results.filter((r) => r.statusCode === 409)).toHaveLength(3);
    await db.query("DELETE FROM cohort_reservations");
  });
  it("F06 activity is opt-in, time-bounded and privacy-thresholded", async () => {
    await db.query("DELETE FROM activity");
    const g = await account();
    await app.inject({
      method: "POST",
      url: "/api/activity",
      headers: headers(g),
      payload: {},
    });
    expect(
      (await app.inject({ url: "/api/community", headers: headers(g) })).json()
        .active,
    ).toBeNull();
    for (let i = 0; i < 5; i++) {
      const id = randomUUID();
      await db.query("INSERT INTO users(id) VALUES($1)", [id]);
      await db.query("INSERT INTO activity(user_id) VALUES($1)", [id]);
    }
    expect(
      (await app.inject({ url: "/api/community", headers: headers(g) })).json()
        .active,
    ).toBe(5);
    await db.query("UPDATE activity SET last_seen=now()-interval '16 minutes'");
    expect(
      (await app.inject({ url: "/api/community", headers: headers(g) })).json()
        .active,
    ).toBeNull();
  });
  it("provider and guest gates fail honestly without fabricated success", async () => {
    const g = await account();
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/billing/checkout",
          headers: headers(g),
          payload: {},
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/brokers/alpaca/connect",
          headers: headers(g),
          payload: { mode: "paper" },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/address/suggestions",
          headers: headers(g),
          payload: { input: "100 Main", sessionToken: randomUUID() },
        })
      ).statusCode,
    ).toBe(503);
  });
  it("F13 security headers prohibit inline scripts and frame embedding", async () => {
    const r = await app.inject({ url: "/" });
    expect(r.statusCode).toBe(200);
    expect(r.headers["content-security-policy"]).toContain("script-src 'self'");
    expect(r.headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(r.headers["x-content-type-options"]).toBe("nosniff");
  });
  it("unknown pages have real 404 status and API errors contain no secrets", async () => {
    expect((await app.inject({ url: "/unknown" })).statusCode).toBe(404);
    const g = await account();
    const r = await app.inject({ url: "/api/unknown", headers: headers(g) });
    expect(r.statusCode).toBe(404);
    expect(r.body).not.toContain(config.SESSION_SECRET);
  });
});

it("support retries are idempotent, owner-scoped, and content-bound", async () => {
  const g = await account(),
    other = await account(),
    requestId = randomUUID();
  const payload = {
    requestId,
    email: "support@example.com",
    message: "Privacy: Please explain the draft retention policy.",
    website: "",
  };
  const send = (owner = g, body = payload) =>
    app.inject({
      method: "POST",
      url: "/api/support",
      headers: headers(owner),
      payload: body,
    });
  const responses = await Promise.all([send(), send()]);
  for (const response of responses) {
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: requestId, accepted: true });
  }
  expect(
    (
      await db.query(
        "SELECT count(*)::int AS count FROM support_cases WHERE id=$1",
        [requestId],
      )
    ).rows[0].count,
  ).toBe(1);
  expect((await send()).statusCode).toBe(200);
  expect((await send(other)).statusCode).toBe(409);
  expect(
    (
      await send(g, {
        ...payload,
        message: "General: A different request must have a new ID.",
      })
    ).statusCode,
  ).toBe(409);
});

it("reads additive stored draft fields during rollback without accepting unknown write fields", async () => {
  const g = await account();
  await db.query("INSERT INTO drafts(user_id,data) VALUES($1,$2)", [
    g.session.user.id,
    JSON.stringify({
      note: "Keep my research",
      laterReleaseField: "optional metadata",
    }),
  ]);
  const response = await app.inject({ url: "/api/draft", headers: headers(g) });
  expect(response.statusCode).toBe(200);
  expect(response.json().data.note).toBe("Keep my research");
  expect(response.json().data).not.toHaveProperty("laterReleaseField");
  const write = await app.inject({
    method: "PUT",
    url: "/api/draft",
    headers: headers(g),
    payload: {
      revision: 0,
      data: { ...response.json().data, laterReleaseField: "untrusted" },
    },
  });
  expect(write.statusCode).toBe(400);
});
