import { randomUUID, createHmac } from "node:crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { transaction } from "./db.js";
import { hash, token, csrf, equal } from "./crypto.js";
import { AppError } from "./errors.js";
import type { Context } from "./types.js";
export function cookieName(production: boolean) {
  return production ? "__Host-mirrortape" : "mirrortape";
}
export async function newSession(
  ctx: Context,
  userId: string,
  reply: FastifyReply,
  authenticated = false,
  previousHash?: string,
  expectedPasswordHash?: string,
) {
  const secret = token();
  await transaction(ctx.db, async (client) => {
    const user = await client.query(
      "SELECT password_hash FROM users WHERE id=$1 FOR UPDATE",
      [userId],
    );
    if (
      !user.rowCount ||
      (expectedPasswordHash !== undefined &&
        user.rows[0].password_hash !== expectedPasswordHash)
    )
      throw new AppError(
        401,
        "AUTH_CHANGED",
        "Your sign-in details changed. Sign in again with your current method.",
      );
    if (previousHash) {
      const previous = await client.query(
        "SELECT 1 FROM sessions WHERE token_hash=$1 AND expires_at>now() FOR UPDATE",
        [previousHash],
      );
      if (!previous.rowCount)
        throw new AppError(
          401,
          "SESSION_EXPIRED",
          "Your session has ended. Reload the page and sign in again.",
        );
    }
    await client.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at,authenticated) VALUES($1,$2,now()+interval '7 days',$3)",
      [hash(secret), userId, authenticated],
    );
    if (previousHash)
      await client.query("DELETE FROM sessions WHERE token_hash=$1", [
        previousHash,
      ]);
  });
  reply.setCookie(cookieName(ctx.config.NODE_ENV === "production"), secret, {
    httpOnly: true,
    secure: ctx.config.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
  return secret;
}
export function requireAuthenticated(request: FastifyRequest) {
  if (!request.identity.authenticated)
    throw new AppError(
      401,
      "SIGN_IN_REQUIRED",
      "Sign in to open your private dashboard. You can explore the demo without an account.",
    );
}
export function requireMember(request: FastifyRequest) {
  if (!request.identity.authenticated || !request.identity.verified)
    throw new AppError(
      403,
      "VERIFY_ACCOUNT",
      "Verify your email before using this feature. You can keep exploring as a guest.",
    );
}
export async function slidingLimit(
  ctx: Context,
  key: string,
  limit: number,
  windowSeconds: number,
) {
  return transaction(ctx.db, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      key,
    ]);
    await client.query(
      "INSERT INTO rate_windows(key) VALUES($1) ON CONFLICT DO NOTHING",
      [key],
    );
    const result = await client.query(
      `UPDATE rate_windows SET hits=ARRAY(SELECT t FROM unnest(hits) t WHERE t>now()-make_interval(secs=>$2)),penalty=CASE WHEN updated_at<now()-interval '1 hour' THEN 0 ELSE penalty END WHERE key=$1 RETURNING cardinality(hits) AS count,penalty,ceil(extract(epoch FROM blocked_until-now())) AS wait`,
      [key, windowSeconds],
    );
    const row = result.rows[0];
    if (Number(row.wait) > 0) return Number(row.wait);
    if (row.count >= limit) {
      const wait = Math.min(
        900,
        Math.max(windowSeconds, 15 * 2 ** Math.min(row.penalty, 6)),
      );
      await client.query(
        "UPDATE rate_windows SET penalty=penalty+1,blocked_until=now()+make_interval(secs=>$2),updated_at=now() WHERE key=$1",
        [key, wait],
      );
      return wait;
    }
    await client.query(
      "UPDATE rate_windows SET hits=array_append(hits,now()),updated_at=now() WHERE key=$1",
      [key],
    );
    return 0;
  });
}
export async function security(app: FastifyInstance, ctx: Context) {
  app.decorateRequest("identity");
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api/")) return;
    reply.header("Cache-Control", "no-store");
    const endpoint = request.url.split("?")[0] ?? "";
    const fingerprint = createHmac("sha256", ctx.config.SESSION_SECRET)
      .update(request.ip)
      .digest("hex");
    const wait = await slidingLimit(ctx, `ip:${fingerprint}`, 240, 60);
    if (wait)
      throw new AppError(
        429,
        "RATE_LIMIT",
        "There have been too many requests. Please wait a moment and try again.",
        wait,
      );
    if (endpoint === "/api/public/status" && request.method === "GET") return;
    if (
      endpoint === "/api/webhooks/stripe" ||
      /^\/api\/auth\/social\/(google|apple|facebook)\/callback$/.test(endpoint)
    )
      return;
    const raw =
      request.cookies[cookieName(ctx.config.NODE_ENV === "production")];
    const sessions =
      raw && /^[a-f0-9]{64}$/.test(raw)
        ? await ctx.db.query(
            "SELECT s.user_id,s.authenticated,u.email,u.verified FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
            [hash(raw)],
          )
        : null;
    let secret = raw ?? "";
    let user = sessions?.rows[0];
    if (!user) {
      if (endpoint === "/api/auth/status" && request.method === "GET")
        return reply.send({ authenticated: false });
      if (endpoint !== "/api/session" || request.method !== "GET")
        throw new AppError(
          401,
          "SESSION_EXPIRED",
          "Your session has ended. Reload the page to continue.",
        );
      if (
        request.headers["sec-fetch-site"] === "cross-site" ||
        (request.headers.origin &&
          request.headers.origin !== ctx.config.APP_ORIGIN)
      )
        throw new AppError(
          403,
          "ORIGIN",
          "Open MirrorTape directly to continue.",
        );
      const userId = randomUUID();
      await ctx.db.query("INSERT INTO users(id) VALUES($1)", [userId]);
      secret = await newSession(ctx, userId, reply);
      user = {
        user_id: userId,
        email: null,
        verified: false,
        authenticated: false,
      };
    }
    request.identity = {
      userId: user.user_id,
      sessionHash: hash(secret),
      sessionToken: secret,
      email: user.email,
      verified: user.verified,
      authenticated: user.authenticated,
    };
    if (
      (endpoint.startsWith("/api/watchlist") ||
        endpoint === "/api/audit" ||
        endpoint.startsWith("/api/brokers")) &&
      !request.identity.authenticated
    )
      requireAuthenticated(request);
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      if (request.headers.origin !== ctx.config.APP_ORIGIN)
        throw new AppError(
          403,
          "ORIGIN",
          "This request did not come from MirrorTape. Reload the page and try again.",
        );
      const supplied = request.headers["x-csrf-token"];
      if (
        typeof supplied !== "string" ||
        !equal(supplied, csrf(secret, ctx.config.SESSION_SECRET))
      )
        throw new AppError(
          403,
          "CSRF",
          "Your page needs to be refreshed before saving. Reload and try again.",
        );
      const wait = await slidingLimit(
        ctx,
        `write:${request.identity.userId}`,
        90,
        60,
      );
      if (wait)
        throw new AppError(
          429,
          "RATE_LIMIT",
          "Changes are arriving too quickly. Wait a moment and try again.",
          wait,
        );
    }
    if (endpoint.startsWith("/api/auth/") && request.method !== "GET") {
      const wait = await slidingLimit(ctx, `auth:${fingerprint}`, 15, 600);
      if (wait)
        throw new AppError(
          429,
          "RATE_LIMIT",
          "For your account’s safety, wait before trying to sign in again.",
          wait,
        );
    }
  });
}
