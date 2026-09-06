import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { readConfig } from "../../server/config";
import { database } from "../../server/db";
import { migrate } from "../../server/migrations";
import { buildApp } from "../../server/app";
import { unseal } from "../../server/crypto";
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
const config = {
  ...readConfig(),
  ALPACA_CLIENT_ID: "test-client",
  ALPACA_CLIENT_SECRET: "test-secret",
  ALPACA_COMMERCIAL_APPROVED: "true" as const,
  GOOGLE_PLACES_API_KEY: "test-places",
  STRIPE_SECRET_KEY: "sk_test_fixture",
  STRIPE_WEBHOOK_SECRET: "whsec_fixture",
  STRIPE_PRICE_ID: "price_fixture",
  BILLING_ENABLED: "true" as const,
};
if (
  config.NODE_ENV !== "test" ||
  !new URL(config.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Dedicated test database required");
const transport = vi.fn<typeof fetch>();
const db = database(config);
vi.stubGlobal("fetch", transport);
const app = await buildApp({ db, config }, false);
vi.unstubAllGlobals();
beforeAll(async () => {
  await migrate(db);
  await app.ready();
});
beforeEach(async () => {
  await db.query("DELETE FROM rate_windows");
});
afterEach(() => vi.unstubAllGlobals());
afterAll(async () => app.close());
async function member() {
  const result = await app.inject({ url: "/api/session" });
  const session = result.json();
  const cookie = result.headers["set-cookie"]?.toString().split(";")[0] ?? "";
  await db.query("UPDATE users SET verified=true,email=$2 WHERE id=$1", [
    session.user.id,
    `${randomUUID()}@example.com`,
  ]);
  return {
    session,
    headers: {
      cookie,
      origin: config.APP_ORIGIN,
      "x-csrf-token": session.csrf,
    },
  };
}
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
describe("provider boundary contracts with deterministic external responses", () => {
  it("Alpaca callback is single-use, session bound, and stores an encrypted read-only connection", async () => {
    const g = await member();
    const connect = await app.inject({
      method: "POST",
      url: "/api/brokers/alpaca/connect",
      headers: g.headers,
      payload: { mode: "paper" },
    });
    const url = new URL(connect.json().url);
    expect(url.hostname).toBe("app.alpaca.markets");
    expect(url.searchParams.get("scope")).toBeNull();
    const state = url.searchParams.get("state");
    const accountId = randomUUID();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes("/oauth/token")
          ? response({ access_token: "private-token", token_type: "bearer" })
          : response({
              id: accountId,
              status: "ACTIVE",
              currency: "USD",
              equity: "1000",
              cash: "1000",
              buying_power: "1000",
              trading_blocked: false,
            }),
      ),
    );
    const foreign = await member();
    expect(
      (
        await app.inject({
          url: `/api/brokers/alpaca/callback?code=code&state=${state}`,
          headers: foreign.headers,
        })
      ).statusCode,
    ).toBe(400);
    const result = await app.inject({
      url: `/api/brokers/alpaca/callback?code=code&state=${state}`,
      headers: g.headers,
    });
    expect(result.statusCode).toBe(302);
    const stored = await db.query(
      "SELECT encrypted_token FROM broker_connections WHERE user_id=$1",
      [g.session.user.id],
    );
    expect(stored.rows[0].encrypted_token).not.toContain("private-token");
    expect(unseal(stored.rows[0].encrypted_token, config.ENCRYPTION_KEY)).toBe(
      "private-token",
    );
    expect(
      (
        await app.inject({
          url: `/api/brokers/alpaca/callback?code=code&state=${state}`,
          headers: g.headers,
        })
      ).statusCode,
    ).toBe(400);
  });
  it("F10 address queries call only the fixed provider, expose no key, and fail clearly", async () => {
    const g = await member();
    const fake = vi.fn(async () =>
      response({
        suggestions: [
          {
            placePrediction: {
              placeId: "place-one",
              text: { text: "100 Main Street" },
            },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fake);
    const r = await app.inject({
      method: "POST",
      url: "/api/address/suggestions",
      headers: g.headers,
      payload: { input: "100 Main", sessionToken: randomUUID() },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().suggestions[0]).toEqual({
      id: "place-one",
      label: "100 Main Street",
    });
    expect(r.body).not.toContain(config.GOOGLE_PLACES_API_KEY);
    expect(fake.mock.calls.length).toBe(1);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response({}, 503)),
    );
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/address/suggestions",
          headers: g.headers,
          payload: { input: "100 Main", sessionToken: randomUUID() },
        })
      ).statusCode,
    ).toBe(503);
  });
  it("Stripe signatures, duplicate delivery and current-state reconciliation protect entitlements", async () => {
    const g = await member();
    const customer = `cus_${randomUUID()}`;
    await db.query(
      "INSERT INTO billing_customers(user_id,customer_id) VALUES($1,$2)",
      [g.session.user.id, customer],
    );
    let status = "active";
    transport.mockImplementation(async () =>
      response({
        object: "list",
        data: [
          {
            id: `sub_${g.session.user.id}`,
            object: "subscription",
            created: 1,
            customer,
            status,
            items: { data: [{ price: { id: "price_fixture" } }] },
          },
        ],
        has_more: false,
        url: "/v1/subscriptions",
      }),
    );
    const stripe = new Stripe("sk_test_fixture");
    async function send(id: string) {
      const payload = JSON.stringify({
        id,
        object: "event",
        type: "customer.subscription.updated",
        data: { object: { id: "sub_fixture", customer, status: "active" } },
      });
      const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: config.STRIPE_WEBHOOK_SECRET,
      });
      return app.inject({
        method: "POST",
        url: "/api/webhooks/stripe",
        headers: {
          "content-type": "application/json",
          "stripe-signature": signature,
        },
        payload,
      });
    }
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/webhooks/stripe",
          headers: {
            "content-type": "application/json",
            "stripe-signature": "forged",
          },
          payload: "{}",
        })
      ).statusCode,
    ).toBe(400);
    const eventId = `evt_${randomUUID()}`;
    expect((await send(eventId)).statusCode).toBe(200);
    expect((await send(eventId)).statusCode).toBe(200);
    expect(
      (
        await db.query(
          "SELECT status FROM billing_subscriptions WHERE user_id=$1",
          [g.session.user.id],
        )
      ).rows[0].status,
    ).toBe("active");
    status = "canceled";
    expect((await send(`evt_${randomUUID()}`)).statusCode).toBe(200);
    expect(
      (
        await db.query(
          "SELECT status FROM billing_subscriptions WHERE user_id=$1",
          [g.session.user.id],
        )
      ).rows[0].status,
    ).toBe("canceled");
  });
});
