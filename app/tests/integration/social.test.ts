import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  it,
  expect,
  vi,
} from "vitest";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { generateKeyPair, exportJWK, exportPKCS8, SignJWT } from "jose";
import { readConfig } from "../../server/config";
import { database } from "../../server/db";
import { migrate } from "../../server/migrations";
import { buildApp } from "../../server/app";
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
const signing = await generateKeyPair("RS256");
const appleClient = await generateKeyPair("ES256", { extractable: true });
const jwk = {
  ...(await exportJWK(signing.publicKey)),
  kid: "test-key",
  alg: "RS256",
  use: "sig",
};
const config = {
  ...readConfig(),
  GOOGLE_CLIENT_ID: "google-client",
  GOOGLE_CLIENT_SECRET: "google-secret",
  APPLE_CLIENT_ID: "apple-client",
  APPLE_TEAM_ID: "apple-team",
  APPLE_KEY_ID: "apple-key",
  APPLE_PRIVATE_KEY_BASE64: Buffer.from(
    await exportPKCS8(appleClient.privateKey),
  ).toString("base64"),
  FACEBOOK_CLIENT_ID: "facebook-client",
  FACEBOOK_CLIENT_SECRET: "facebook-secret",
  FACEBOOK_GRAPH_VERSION: "v25.0",
};
if (
  config.NODE_ENV !== "test" ||
  !new URL(config.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Dedicated test database required");
const db = database(config),
  app = await buildApp({ db, config }, false);
let subject = "",
  email = "",
  nonce = "",
  provider = "google",
  wrongNonce = false,
  wrongAudience = false,
  wrongFacebookApp = false;
const response = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
beforeAll(async () => {
  await migrate(db);
  await app.ready();
});
afterAll(async () => app.close());
afterEach(() => vi.unstubAllGlobals());
beforeEach(async () => {
  await db.query("DELETE FROM rate_windows");
  subject = randomUUID();
  email = `social-${randomUUID()}@example.com`;
  wrongNonce = false;
  wrongAudience = false;
  wrongFacebookApp = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/certs") || url.endsWith("/auth/keys"))
        return response({ keys: [jwk] });
      if (
        url === "https://oauth2.googleapis.com/token" ||
        url === "https://appleid.apple.com/auth/token"
      ) {
        const body = new URLSearchParams(String(init?.body));
        expect(body.get("code")).toBe("valid-code");
        if (provider === "google")
          expect(body.get("code_verifier")).toHaveLength(64);
        const idToken = await new SignJWT({
          nonce: wrongNonce ? "wrong" : nonce,
          email,
          email_verified: true,
        })
          .setProtectedHeader({ alg: "RS256", kid: "test-key" })
          .setSubject(subject)
          .setIssuer(
            provider === "google"
              ? "https://accounts.google.com"
              : "https://appleid.apple.com",
          )
          .setAudience(
            wrongAudience
              ? "attacker-client"
              : provider === "google"
                ? "google-client"
                : "apple-client",
          )
          .setIssuedAt()
          .setExpirationTime("5m")
          .sign(signing.privateKey);
        return response({ id_token: idToken });
      }
      if (url.endsWith("/oauth/access_token"))
        return response({ access_token: "facebook-user-token" });
      if (url.includes("/debug_token?"))
        return response({
          data: {
            is_valid: true,
            app_id: wrongFacebookApp ? "wrong" : "facebook-client",
            user_id: subject,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        });
      if (url.includes("/me?")) return response({ id: subject, email });
      throw new Error("Unexpected external request in test");
    }),
  );
});
async function browser() {
  const r = await app.inject({ url: "/api/session" });
  return {
    session: r.json(),
    cookie: r.headers["set-cookie"]!.toString().split(";")[0]!,
  };
}
async function start(
  g: Awaited<ReturnType<typeof browser>>,
  p = "google",
  intent = "login",
) {
  provider = p;
  const r = await app.inject({
    method: "POST",
    url: `/api/auth/social/${p}/start`,
    headers: {
      cookie: g.cookie,
      origin: config.APP_ORIGIN,
      "x-csrf-token": g.session.csrf,
    },
    payload: { intent, acceptedTerms: "2026-09-07", adult: true },
  });
  expect(r.statusCode).toBe(200);
  const url = new URL(r.json().url);
  nonce = url.searchParams.get("nonce") ?? "";
  return {
    state: url.searchParams.get("state")!,
    cookie: r.headers["set-cookie"]!.toString().split(";")[0]!,
  };
}
async function callback(
  g: Awaited<ReturnType<typeof browser>>,
  s: Awaited<ReturnType<typeof start>>,
  p = "google",
  applePost = false,
) {
  return app.inject(
    applePost
      ? {
          method: "POST",
          url: `/api/auth/social/${p}/callback`,
          headers: {
            cookie: s.cookie,
            "content-type": "application/x-www-form-urlencoded",
          },
          payload: new URLSearchParams({
            state: s.state,
            code: "valid-code",
          }).toString(),
        }
      : {
          url: `/api/auth/social/${p}/callback?state=${s.state}&code=valid-code`,
          headers: { cookie: `${g.cookie}; ${s.cookie}` },
        },
  );
}
it.each(["google", "apple", "facebook"])(
  "%s creates an authenticated account using verified provider identity",
  async (p) => {
    const g = await browser(),
      s = await start(g, p);
    const r = await callback(g, s, p, p === "apple");
    expect(r.statusCode).toBe(302);
    expect(r.headers.location).toBe("/app");
    const cookies = r.headers["set-cookie"] as string[];
    const cookie = cookies
      .find((c) => c.startsWith("mirrortape="))!
      .split(";")[0]!;
    const session = (
      await app.inject({ url: "/api/session", headers: { cookie } })
    ).json();
    expect(session.user.authenticated).toBe(true);
    expect(session.user.verified).toBe(p !== "facebook");
    expect(
      (await app.inject({ url: "/api/watchlist", headers: { cookie } }))
        .statusCode,
    ).toBe(200);
    expect((await callback(g, s, p, p === "apple")).headers.location).toBe(
      "/app/login?auth=failed",
    );
  },
);
it("binds callbacks to the initiating browser even with a valid state", async () => {
  const g = await browser(),
    s = await start(g);
  const r = await app.inject({
    url: `/api/auth/social/google/callback?state=${s.state}&code=valid-code`,
    headers: { cookie: g.cookie },
  });
  expect(r.headers.location).toBe("/app/login?auth=failed");
  expect(
    (
      await db.query("SELECT 1 FROM social_identities WHERE subject=$1", [
        subject,
      ])
    ).rowCount,
  ).toBe(0);
});
it.each(["nonce", "audience"])(
  "rejects signed tokens with an invalid %s",
  async (kind) => {
    const g = await browser(),
      s = await start(g);
    wrongNonce = kind === "nonce";
    wrongAudience = kind === "audience";
    expect((await callback(g, s)).headers.location).toBe(
      "/app/login?auth=failed",
    );
    expect(
      (
        await db.query("SELECT 1 FROM social_identities WHERE subject=$1", [
          subject,
        ])
      ).rowCount,
    ).toBe(0);
  },
);
it("never merges an existing account based solely on matching email", async () => {
  const owner = await browser();
  await db.query("UPDATE users SET email=$2 WHERE id=$1", [
    owner.session.user.id,
    email,
  ]);
  const attacker = await browser(),
    s = await start(attacker);
  expect((await callback(attacker, s)).headers.location).toBe(
    "/app/login?auth=account_exists",
  );
  expect(
    (
      await db.query("SELECT 1 FROM social_identities WHERE user_id=$1", [
        owner.session.user.id,
      ])
    ).rowCount,
  ).toBe(0);
});
it("links a provider only through a recent authenticated session", async () => {
  const owner = await browser();
  await db.query("UPDATE users SET email=$2 WHERE id=$1", [
    owner.session.user.id,
    email,
  ]);
  await db.query("UPDATE sessions SET authenticated=true WHERE user_id=$1", [
    owner.session.user.id,
  ]);
  const s = await start(owner, "google", "link");
  expect((await callback(owner, s)).headers.location).toBe("/app");
  expect(
    (
      await db.query("SELECT user_id FROM social_identities WHERE subject=$1", [
        subject,
      ])
    ).rows[0].user_id,
  ).toBe(owner.session.user.id);
});
it("rejects a Facebook token issued for a different application", async () => {
  const g = await browser(),
    s = await start(g, "facebook");
  wrongFacebookApp = true;
  expect((await callback(g, s, "facebook")).headers.location).toBe(
    "/app/login?auth=failed",
  );
});
it("does not authorize a callback after the initiating session is revoked", async () => {
  const g = await browser(),
    s = await start(g);
  await db.query("DELETE FROM sessions WHERE user_id=$1", [g.session.user.id]);
  expect((await callback(g, s)).headers.location).toBe(
    "/app/login?auth=failed",
  );
});
it("requires authentication for private dashboard data while public status stays anonymous", async () => {
  const status = await app.inject({ url: "/api/auth/status" });
  expect(status.json()).toEqual({ authenticated: false });
  expect(status.headers["set-cookie"]).toBeUndefined();
  const g = await browser();
  expect(
    (await app.inject({ url: "/api/watchlist", headers: { cookie: g.cookie } }))
      .statusCode,
  ).toBe(401);
});

it("requires agreement for a new social signup and binds it to the particular attempt", async () => {
  const g = await browser(),
    s = await start(g, "google");
  await db.query(
    "UPDATE audit_events SET detail=jsonb_set(detail,'{stateHash}','\"wrong-attempt\"'::jsonb) WHERE user_id=$1 AND action='terms_accepted'",
    [g.session.user.id],
  );
  const r = await callback(g, s);
  expect(r.headers.location).toBe("/app/login?auth=accept_terms");
  expect(
    (
      await db.query("SELECT 1 FROM social_identities WHERE subject=$1", [
        subject,
      ])
    ).rowCount,
  ).toBe(0);
});
