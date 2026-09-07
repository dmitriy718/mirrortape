import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Context } from "../types.js";
import { csrf, equal } from "../crypto.js";
import { draftData, trap, email, safeText, idParams } from "../validation.js";
import { transaction } from "../db.js";
import { slidingLimit } from "../security.js";
import { AppError } from "../errors.js";
export async function workspaceRoutes(app: FastifyInstance, ctx: Context) {
  const { db, config } = ctx;
  app.get("/api/session", async (request) => ({
    csrf: csrf(request.identity.sessionToken, config.SESSION_SECRET),
    user: {
      id: request.identity.userId,
      email: request.identity.email,
      verified: request.identity.verified,
      authenticated: request.identity.authenticated,
    },
    features: {
      email: Boolean(config.SMTP_URL),
      billing: config.BILLING_ENABLED === "true",
      alpaca: Boolean(config.ALPACA_CLIENT_ID && config.ALPACA_CLIENT_SECRET),
      address: Boolean(config.GOOGLE_PLACES_API_KEY),
    },
    storage: config.NODE_ENV === "production" ? "cloud" : "server",
    termsUrl: config.LEGAL_TERMS_URL ?? null,
    privacyUrl: config.LEGAL_PRIVACY_URL ?? null,
  }));
  app.get("/api/draft", async (request) => {
    const result = await db.query(
      "SELECT revision,data,updated_at FROM drafts WHERE user_id=$1",
      [request.identity.userId],
    );
    const r = result.rows[0];
    return {
      data: draftData.strip().parse(r?.data ?? {}),
      revision: r?.revision ?? 0,
      savedAt: r?.updated_at ?? null,
    };
  });
  app.put("/api/draft", async (request, reply) => {
    const body = z
      .object({
        revision: z.number().int().nonnegative(),
        data: draftData,
        ...trap,
      })
      .strict()
      .parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    return transaction(db, async (client) => {
      await client.query(
        "INSERT INTO drafts(user_id) VALUES($1) ON CONFLICT DO NOTHING",
        [request.identity.userId],
      );
      const result = await client.query(
        "UPDATE drafts SET data=$2,revision=revision+1,updated_at=now() WHERE user_id=$1 AND revision=$3 RETURNING revision,updated_at",
        [request.identity.userId, JSON.stringify(body.data), body.revision],
      );
      if (!result.rowCount)
        throw new AppError(
          409,
          "DRAFT_CONFLICT",
          "This draft changed in another tab. Reload the saved version before making more changes.",
        );
      if (!body.data.shareActivity)
        await client.query("DELETE FROM activity WHERE user_id=$1", [
          request.identity.userId,
        ]);
      return {
        revision: result.rows[0].revision,
        savedAt: result.rows[0].updated_at,
      };
    });
  });
  app.post("/api/activity", async (request, reply) => {
    const body = z.object(trap).strict().parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    await db.query(
      "INSERT INTO activity(user_id) SELECT user_id FROM drafts WHERE user_id=$1 AND data->>'shareActivity'='true' ON CONFLICT(user_id) DO UPDATE SET last_seen=now()",
      [request.identity.userId],
    );
    return { accepted: true };
  });
  app.get("/api/community", async () => {
    const result = await db.query(
      "SELECT count(*)::integer AS count FROM activity WHERE last_seen>now()-interval '15 minutes'",
    );
    const count = result.rows[0].count;
    return {
      active: count >= 5 ? Math.floor(count / 5) * 5 : null,
      windowMinutes: 15,
    };
  });
  const availability = async () => {
    if (!config.COHORT_CAPACITY)
      return { available: false, remaining: null, endsAt: null };
    if (config.COHORT_END && Date.parse(config.COHORT_END) <= Date.now())
      return { available: false, remaining: 0, endsAt: config.COHORT_END };
    const r = await db.query(
      "SELECT count(*)::integer AS count FROM cohort_reservations WHERE expires_at>now()",
    );
    return {
      available: true,
      remaining: Math.max(0, config.COHORT_CAPACITY - r.rows[0].count),
      endsAt: config.COHORT_END ?? null,
    };
  };
  app.get("/api/availability", availability);
  app.post("/api/reservations", async (request, reply) => {
    const body = z.object(trap).strict().parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    if (
      !config.COHORT_CAPACITY ||
      (config.COHORT_END && Date.parse(config.COHORT_END) <= Date.now())
    )
      throw new AppError(
        409,
        "COHORT_CLOSED",
        "Reservations are not open right now. You can still use your workspace.",
      );
    if (!request.identity.verified)
      throw new AppError(
        403,
        "VERIFY_ACCOUNT",
        "Verify your email to reserve a place.",
      );
    return transaction(db, async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(71824002)");
      const existing = await client.query(
        "SELECT expires_at FROM cohort_reservations WHERE user_id=$1 AND expires_at>now()",
        [request.identity.userId],
      );
      if (existing.rowCount) return { expiresAt: existing.rows[0].expires_at };
      const count = await client.query(
        "SELECT count(*)::integer AS count FROM cohort_reservations WHERE expires_at>now()",
      );
      if (count.rows[0].count >= config.COHORT_CAPACITY)
        throw new AppError(
          409,
          "COHORT_FULL",
          "This cohort is full. Please check again later.",
        );
      const result = await client.query(
        "INSERT INTO cohort_reservations(user_id,expires_at) VALUES($1,LEAST(now()+interval '24 hours',COALESCE($2::timestamptz,'infinity'))) ON CONFLICT(user_id) DO UPDATE SET expires_at=excluded.expires_at RETURNING expires_at",
        [request.identity.userId, config.COHORT_END ?? null],
      );
      return { expiresAt: result.rows[0].expires_at };
    });
  });
  const undoFor = (id: string, user: string, date: Date) =>
    csrf(`${id}:${user}:${date.toISOString()}`, config.SESSION_SECRET);
  app.get("/api/watchlist", async (request) => {
    const result = await db.query(
      "SELECT id,symbol,delete_at FROM watchlist WHERE user_id=$1 AND (delete_at IS NULL OR delete_at>now()) ORDER BY created_at",
      [request.identity.userId],
    );
    return {
      items: result.rows.map((r) => ({
        id: r.id,
        symbol: r.symbol,
        deleteAt: r.delete_at,
        undoToken: r.delete_at
          ? undoFor(r.id, request.identity.userId, r.delete_at)
          : null,
      })),
      serverTime: new Date().toISOString(),
    };
  });
  app.post("/api/watchlist", async (request, reply) => {
    const body = z
      .object({
        symbol: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z][A-Z0-9.-]{0,9}$/),
        ...trap,
      })
      .strict()
      .parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    return transaction(db, async (client) => {
      await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
        request.identity.userId,
      ]);
      await client.query(
        "DELETE FROM watchlist WHERE user_id=$1 AND delete_at<=now()",
        [request.identity.userId],
      );
      const count = await client.query(
        "SELECT count(*)::integer AS count FROM watchlist WHERE user_id=$1",
        [request.identity.userId],
      );
      const existing = await client.query(
        "SELECT id,symbol,delete_at FROM watchlist WHERE user_id=$1 AND symbol=$2",
        [request.identity.userId, body.symbol],
      );
      if (existing.rowCount) {
        if (existing.rows[0].delete_at)
          throw new AppError(
            409,
            "PENDING_DELETE",
            "Undo the removal before adding this symbol again.",
          );
        return { id: existing.rows[0].id, symbol: body.symbol };
      }
      if (count.rows[0].count >= 50)
        throw new AppError(
          409,
          "WATCHLIST_FULL",
          "Your watchlist has reached 50 symbols. Remove a symbol before adding another.",
        );
      const id = randomUUID();
      await client.query(
        "INSERT INTO watchlist(id,user_id,symbol) VALUES($1,$2,$3)",
        [id, request.identity.userId, body.symbol],
      );
      return { id, symbol: body.symbol };
    });
  });
  app.delete("/api/watchlist/:id", async (request) => {
    const { id } = idParams.parse(request.params);
    z.object({})
      .strict()
      .parse(request.body ?? {});
    const r = await db.query(
      "UPDATE watchlist SET delete_at=COALESCE(delete_at,now()+interval '5 seconds') WHERE id=$1 AND user_id=$2 AND (delete_at IS NULL OR delete_at>now()) RETURNING delete_at",
      [id, request.identity.userId],
    );
    if (!r.rowCount)
      throw new AppError(
        404,
        "NOT_FOUND",
        "This symbol has already been removed. Refresh your watchlist.",
      );
    return {
      id,
      deleteAt: r.rows[0].delete_at,
      undoToken: undoFor(id, request.identity.userId, r.rows[0].delete_at),
    };
  });
  app.post("/api/watchlist/:id/undo", async (request) => {
    const { id } = idParams.parse(request.params);
    const { undoToken } = z
      .object({ undoToken: z.string().length(64) })
      .strict()
      .parse(request.body);
    return transaction(db, async (client) => {
      const r = await client.query(
        "SELECT delete_at FROM watchlist WHERE id=$1 AND user_id=$2 AND delete_at>now() FOR UPDATE",
        [id, request.identity.userId],
      );
      if (!r.rowCount)
        throw new AppError(
          409,
          "UNDO_EXPIRED",
          "The five-second undo window has ended. You can add this symbol again.",
        );
      if (
        !equal(
          undoToken,
          undoFor(id, request.identity.userId, r.rows[0].delete_at),
        )
      )
        throw new AppError(
          403,
          "UNDO_INVALID",
          "Refresh your watchlist to restore this symbol.",
        );
      await client.query("UPDATE watchlist SET delete_at=NULL WHERE id=$1", [
        id,
      ]);
      return { restored: true };
    });
  });
  app.post("/api/support", async (request, reply) => {
    const body = z
      .object({
        email,
        message: safeText(4000).min(10),
        requestId: z.uuid().optional(),
        ...trap,
      })
      .strict()
      .parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    const id = body.requestId ?? randomUUID();
    const previous = await db.query(
      "SELECT user_id,email,message FROM support_cases WHERE id=$1",
      [id],
    );
    if (previous.rowCount) {
      const row = previous.rows[0];
      if (
        row.user_id !== request.identity.userId ||
        row.email !== body.email ||
        row.message !== body.message
      )
        throw new AppError(
          409,
          "REQUEST_CHANGED",
          "This request reference belongs to different information. Update your message and submit a new request.",
        );
      return { id, accepted: true };
    }
    const wait = await slidingLimit(
      ctx,
      `support:${csrf(request.ip, config.SESSION_SECRET)}`,
      5,
      600,
    );
    if (wait)
      throw new AppError(
        429,
        "RATE_LIMIT",
        "Several requests have already arrived. Keep your message and try again after the waiting period.",
        wait,
      );
    const inserted = await db.query(
      "INSERT INTO support_cases(id,user_id,email,message) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING RETURNING id",
      [id, request.identity.userId, body.email, body.message],
    );
    if (!inserted.rowCount) {
      const same = await db.query(
        "SELECT 1 FROM support_cases WHERE id=$1 AND user_id=$2 AND email=$3 AND message=$4",
        [id, request.identity.userId, body.email, body.message],
      );
      if (!same.rowCount)
        throw new AppError(
          409,
          "REQUEST_CHANGED",
          "Update your message and submit a new request.",
        );
    }
    return { id, accepted: true };
  });
  app.get("/api/audit", async (request) => ({
    events: (
      await db.query(
        "SELECT id,action,created_at FROM audit_events WHERE user_id=$1 ORDER BY id DESC LIMIT 50",
        [request.identity.userId],
      )
    ).rows,
  }));
}
