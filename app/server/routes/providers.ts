import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Context } from "../types.js";
import { requireMember, slidingLimit } from "../security.js";
import { AppError, unavailable } from "../errors.js";
import { hash, token, seal, unseal } from "../crypto.js";
import { transaction } from "../db.js";
const accountSchema = z.object({
  id: z.string(),
  status: z.string(),
  currency: z.string(),
  equity: z.string(),
  cash: z.string(),
  buying_power: z.string(),
  trading_blocked: z.boolean(),
});
const positionsSchema = z
  .array(
    z.object({
      asset_id: z.string(),
      symbol: z.string(),
      qty: z.string(),
      market_value: z.string().nullable(),
      unrealized_pl: z.string().nullable(),
    }),
  )
  .max(10000);
async function providerJson(url: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
  } catch {
    throw new AppError(
      503,
      "PROVIDER_UNREACHABLE",
      "The provider did not respond. Your saved work is safe. Please try again.",
    );
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new AppError(
        409,
        "RECONNECT",
        "The provider no longer accepts this connection. Connect your account again.",
      );
    throw new AppError(
      503,
      "PROVIDER_UNAVAILABLE",
      "The provider is temporarily unavailable. Please try again shortly.",
    );
  }
  const reader = response.body?.getReader();
  if (!reader) throw unavailable("This provider response");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 2_000_000) {
        await reader.cancel();
        throw unavailable("This provider response");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw unavailable("This provider response");
  }
}
export async function providerRoutes(app: FastifyInstance, ctx: Context) {
  const { db, config } = ctx;
  app.post("/api/brokers/alpaca/connect", async (request) => {
    requireMember(request);
    const { mode } = z
      .object({ mode: z.enum(["paper", "live"]) })
      .strict()
      .parse(request.body);
    if (!config.ALPACA_CLIENT_ID || !config.ALPACA_CLIENT_SECRET)
      throw unavailable("Alpaca linking");
    if (mode === "live" && config.ALPACA_COMMERCIAL_APPROVED !== "true")
      throw unavailable("Live account linking");
    const state = token();
    await db.query(
      "INSERT INTO oauth_states(state_hash,user_id,session_hash,mode,expires_at) VALUES($1,$2,$3,$4,now()+interval '10 minutes')",
      [
        hash(state),
        request.identity.userId,
        request.identity.sessionHash,
        mode,
      ],
    );
    const url = new URL("https://app.alpaca.markets/oauth/authorize");
    // Read-only is Alpaca's default scope. Trading authorization is a separate release gate.
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: config.ALPACA_CLIENT_ID,
      redirect_uri: `${config.APP_ORIGIN}/api/brokers/alpaca/callback`,
      state,
      env: mode,
    }).toString();
    return { url: url.toString() };
  });
  app.get("/api/brokers/alpaca/callback", async (request, reply) => {
    requireMember(request);
    const body = z
      .object({
        code: z.string().min(1).max(2048).optional(),
        state: z.string().regex(/^[a-f0-9]{64}$/),
        error: z.string().max(100).optional(),
        error_description: z.string().max(1000).optional(),
      })
      .strict()
      .parse(request.query);
    if (!config.ALPACA_CLIENT_ID || !config.ALPACA_CLIENT_SECRET)
      throw unavailable("Alpaca linking");
    const states = await db.query(
      "UPDATE oauth_states SET used_at=now() WHERE state_hash=$1 AND user_id=$2 AND session_hash=$3 AND expires_at>now() AND used_at IS NULL RETURNING mode",
      [hash(body.state), request.identity.userId, request.identity.sessionHash],
    );
    if (!states.rowCount)
      throw new AppError(
        400,
        "OAUTH_EXPIRED",
        "This connection request expired. Return to your workspace and connect again.",
      );
    if (body.error || !body.code)
      return reply.redirect("/app?connection=declined");
    const mode = states.rows[0].mode as "paper" | "live";
    const result = z
      .object({ access_token: z.string().min(1), token_type: z.string() })
      .parse(
        await providerJson("https://api.alpaca.markets/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: body.code,
            client_id: config.ALPACA_CLIENT_ID,
            client_secret: config.ALPACA_CLIENT_SECRET,
            redirect_uri: `${config.APP_ORIGIN}/api/brokers/alpaca/callback`,
          }),
        }),
      );
    const base =
      mode === "paper"
        ? "https://paper-api.alpaca.markets"
        : "https://api.alpaca.markets";
    const account = accountSchema.parse(
      await providerJson(`${base}/v2/account`, {
        headers: { Authorization: `Bearer ${result.access_token}` },
      }),
    );
    await transaction(db, async (client) => {
      await client.query(
        "INSERT INTO broker_connections(user_id,mode,encrypted_token,account_id) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,mode) DO UPDATE SET encrypted_token=excluded.encrypted_token,account_id=excluded.account_id,connected_at=now()",
        [
          request.identity.userId,
          mode,
          seal(result.access_token, config.ENCRYPTION_KEY),
          account.id,
        ],
      );
      await client.query(
        "INSERT INTO audit_events(user_id,action,detail) VALUES($1,'alpaca_connected',$2)",
        [request.identity.userId, JSON.stringify({ mode })],
      );
    });
    return reply.redirect("/app?connection=connected");
  });
  app.get("/api/brokers", async (request) => ({
    connections: (
      await db.query(
        "SELECT mode,connected_at FROM broker_connections WHERE user_id=$1 ORDER BY mode",
        [request.identity.userId],
      )
    ).rows,
  }));
  app.get("/api/brokers/alpaca/account", async (request) => {
    requireMember(request);
    const { mode } = z
      .object({ mode: z.enum(["paper", "live"]) })
      .strict()
      .parse(request.query);
    const r = await db.query(
      "SELECT encrypted_token,account_id FROM broker_connections WHERE user_id=$1 AND mode=$2",
      [request.identity.userId, mode],
    );
    if (!r.rowCount)
      throw new AppError(
        404,
        "NOT_CONNECTED",
        "Connect your Alpaca account to see its balances and positions.",
      );
    const bearer = unseal(r.rows[0].encrypted_token, config.ENCRYPTION_KEY);
    const base =
      mode === "paper"
        ? "https://paper-api.alpaca.markets"
        : "https://api.alpaca.markets";
    const [rawAccount, rawPositions] = await Promise.all([
      providerJson(`${base}/v2/account`, {
        headers: { Authorization: `Bearer ${bearer}` },
      }),
      providerJson(`${base}/v2/positions`, {
        headers: { Authorization: `Bearer ${bearer}` },
      }),
    ]);
    const account = accountSchema.parse(rawAccount);
    if (account.id !== r.rows[0].account_id)
      throw new AppError(
        409,
        "ACCOUNT_CHANGED",
        "This connection returned a different account. Disconnect it and connect again.",
      );
    return {
      mode,
      account,
      positions: positionsSchema.parse(rawPositions),
      asOf: new Date().toISOString(),
      access: "read-only",
    };
  });
  app.delete("/api/brokers/alpaca/:mode", async (request) => {
    requireMember(request);
    const { mode } = z
      .object({ mode: z.enum(["paper", "live"]) })
      .strict()
      .parse(request.params);
    await transaction(db, async (client) => {
      await client.query(
        "DELETE FROM broker_connections WHERE user_id=$1 AND mode=$2",
        [request.identity.userId, mode],
      );
      await client.query(
        "INSERT INTO audit_events(user_id,action,detail) VALUES($1,'alpaca_disconnected',$2)",
        [request.identity.userId, JSON.stringify({ mode })],
      );
    });
    return {
      disconnected: true,
      message:
        "MirrorTape has removed its stored connection. You can also revoke this application from your Alpaca account.",
    };
  });
  app.post("/api/address/suggestions", async (request) => {
    const body = z
      .object({
        input: z.string().trim().min(3).max(200),
        sessionToken: z.uuid(),
      })
      .strict()
      .parse(request.body);
    if (!config.GOOGLE_PLACES_API_KEY) throw unavailable("Address suggestions");
    const wait = await slidingLimit(
      ctx,
      `places:${request.identity.userId}`,
      20,
      60,
    );
    if (wait)
      throw new AppError(
        429,
        "RATE_LIMIT",
        "Enter your address manually or try suggestions again shortly.",
        wait,
      );
    const raw = await providerJson(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": config.GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
        },
        body: JSON.stringify({
          input: body.input,
          sessionToken: body.sessionToken,
          includedRegionCodes: ["us"],
        }),
      },
    );
    const parsed = z
      .object({
        suggestions: z
          .array(
            z.object({
              placePrediction: z
                .object({
                  placeId: z.string(),
                  text: z.object({ text: z.string() }),
                })
                .optional(),
            }),
          )
          .optional(),
      })
      .parse(raw);
    return {
      suggestions: (parsed.suggestions ?? []).flatMap((s) =>
        s.placePrediction
          ? [
              {
                id: s.placePrediction.placeId,
                label: s.placePrediction.text.text,
              },
            ]
          : [],
      ),
    };
  });
  app.post("/api/address/details", async (request) => {
    const body = z
      .object({
        id: z.string().regex(/^[a-zA-Z0-9_-]{1,250}$/),
        sessionToken: z.uuid(),
      })
      .strict()
      .parse(request.body);
    if (!config.GOOGLE_PLACES_API_KEY) throw unavailable("Address lookup");
    const raw = await providerJson(
      `https://places.googleapis.com/v1/places/${body.id}?sessionToken=${body.sessionToken}`,
      {
        headers: {
          "X-Goog-Api-Key": config.GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask": "formattedAddress",
        },
      },
    );
    return z.object({ formattedAddress: z.string().max(500) }).parse(raw);
  });
}
