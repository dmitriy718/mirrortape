import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Context } from "../types.js";
import {
  providers,
  providerAvailable,
  socialProviderClient,
} from "../auth/social-providers.js";
import { token, hash, seal, unseal } from "../crypto.js";
import { transaction } from "../db.js";
import { AppError } from "../errors.js";
import { newSession, requireAuthenticated, slidingLimit } from "../security.js";
const params = z.object({ provider: z.enum(providers) }).strict();
export async function socialRoutes(app: FastifyInstance, ctx: Context) {
  const { db, config } = ctx;
  const client = socialProviderClient(config);
  const cookie =
    config.NODE_ENV === "production"
      ? "__Host-mirrortape-oauth"
      : "mirrortape-oauth";
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite:
      config.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
    maxAge: 600,
  };
  app.get("/api/auth/providers", async () => ({
    providers: providers.map((id) => ({
      id,
      available: providerAvailable(config, id),
    })),
  }));
  app.get("/api/auth/identities", async (request) => {
    requireAuthenticated(request);
    return {
      providers: (
        await db.query(
          "SELECT provider FROM social_identities WHERE user_id=$1",
          [request.identity.userId],
        )
      ).rows.map((r) => r.provider),
    };
  });
  app.post("/api/auth/social/:provider/start", async (request, reply) => {
    const { provider } = params.parse(request.params);
    const { intent } = z
      .object({ intent: z.enum(["login", "link"]).default("login") })
      .strict()
      .parse(request.body ?? {});
    if (intent === "link") {
      requireAuthenticated(request);
      const recent = await db.query(
        "SELECT 1 FROM sessions WHERE token_hash=$1 AND created_at>now()-interval '10 minutes'",
        [request.identity.sessionHash],
      );
      if (!recent.rowCount)
        throw new AppError(
          403,
          "REAUTHENTICATE",
          "Sign out and sign in again before connecting another sign-in method.",
        );
    } else if (request.identity.authenticated)
      throw new AppError(
        409,
        "ALREADY_SIGNED_IN",
        "You are already signed in. Open your dashboard to connect another sign-in method.",
      );
    const state = token(),
      nonce = token(),
      verifier = token(),
      browser = token();
    const url = client.authorize(
      provider,
      state,
      nonce,
      createHash("sha256").update(verifier).digest("base64url"),
    );
    await db.query(
      "INSERT INTO social_auth_states(state_hash,provider,session_hash,browser_hash,nonce,encrypted_verifier,intent,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,now()+interval '10 minutes')",
      [
        hash(state),
        provider,
        request.identity.sessionHash,
        hash(browser),
        nonce,
        seal(verifier, config.ENCRYPTION_KEY),
        intent,
      ],
    );
    reply.setCookie(cookie, browser, cookieOptions);
    return { url };
  });
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/social/:provider/callback",
    handler: async (request, reply) => {
      let failure = "failed";
      try {
        const { provider } = params.parse(request.params);
        if (request.method === "POST" && provider !== "apple")
          throw new Error("Unexpected callback method");
        const body = z
          .object({
            state: z.string().regex(/^[a-f0-9]{64}$/),
            code: z.string().min(1).max(4096).optional(),
            error: z.string().max(200).optional(),
            error_description: z.string().max(1000).optional(),
            user: z.string().max(4096).optional(),
            iss: z.string().max(200).optional(),
            authuser: z.string().max(100).optional(),
            prompt: z.string().max(100).optional(),
            scope: z.string().max(1000).optional(),
          })
          .strict()
          .parse(request.method === "POST" ? request.body : request.query);
        const browser = request.cookies[cookie];
        if (!browser || !/^[a-f0-9]{64}$/.test(browser))
          throw new Error("Missing browser binding");
        const states = await db.query(
          "UPDATE social_auth_states SET used_at=now() WHERE state_hash=$1 AND provider=$2 AND browser_hash=$3 AND used_at IS NULL AND expires_at>now() RETURNING *",
          [hash(body.state), provider, hash(browser)],
        );
        if (!states.rowCount) throw new Error("Invalid state");
        const state = states.rows[0];
        const sessions = await db.query(
          "SELECT s.user_id,s.authenticated FROM sessions s WHERE token_hash=$1 AND expires_at>now()",
          [state.session_hash],
        );
        if (!sessions.rowCount) throw new Error("Expired browser session");
        if (body.error) {
          failure = "cancelled";
          throw new Error("Provider declined");
        }
        if (!body.code) throw new Error("Missing authorization code");
        const wait = await slidingLimit(
          ctx,
          `social:${state.session_hash}`,
          8,
          600,
        );
        if (wait) throw new Error("Callback limit");
        const profile = await client.exchange(
          provider,
          body.code,
          state.nonce,
          unseal(state.encrypted_verifier, config.ENCRYPTION_KEY),
        );
        const source = sessions.rows[0];
        const userId = await transaction(db, async (connection) => {
          await connection.query(
            "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
            [`social:${provider}:${profile.subject}`],
          );
          const stillValid = await connection.query(
            "SELECT user_id,authenticated FROM sessions WHERE token_hash=$1 AND expires_at>now() FOR UPDATE",
            [state.session_hash],
          );
          if (!stillValid.rowCount) throw new Error("Session revoked");
          const existing = await connection.query(
            "SELECT user_id FROM social_identities WHERE provider=$1 AND subject=$2",
            [provider, profile.subject],
          );
          if (state.intent === "link") {
            if (!source.authenticated || !stillValid.rows[0].authenticated)
              throw new Error("Sign-in required");
            if (
              existing.rowCount &&
              existing.rows[0].user_id !== source.user_id
            ) {
              failure = "linked_elsewhere";
              throw new Error("Identity belongs to another account");
            }
            if (!existing.rowCount)
              await connection.query(
                "INSERT INTO social_identities(provider,subject,user_id) VALUES($1,$2,$3)",
                [provider, profile.subject, source.user_id],
              );
            await connection.query(
              "INSERT INTO audit_events(user_id,action,detail) VALUES($1,'signin_method_connected',$2)",
              [source.user_id, JSON.stringify({ provider })],
            );
            return source.user_id as string;
          }
          if (existing.rowCount) return existing.rows[0].user_id as string;
          if (source.authenticated) throw new Error("Already signed in");
          if (profile.email) {
            await connection.query(
              "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
              [`register:${profile.email}`],
            );
            const collision = await connection.query(
              "SELECT 1 FROM users WHERE email=$1",
              [profile.email],
            );
            if (collision.rowCount) {
              failure = "account_exists";
              throw new Error("Existing account requires explicit linking");
            }
          }
          const guest = await connection.query(
            "SELECT email FROM users WHERE id=$1 FOR UPDATE",
            [source.user_id],
          );
          if (!guest.rowCount || guest.rows[0].email)
            throw new Error("Account changed");
          await connection.query(
            "UPDATE users SET email=$2,verified=$3 WHERE id=$1",
            [source.user_id, profile.email, profile.verified],
          );
          await connection.query(
            "INSERT INTO social_identities(provider,subject,user_id) VALUES($1,$2,$3)",
            [provider, profile.subject, source.user_id],
          );
          await connection.query(
            "INSERT INTO audit_events(user_id,action,detail) VALUES($1,'social_account_created',$2)",
            [source.user_id, JSON.stringify({ provider })],
          );
          return source.user_id as string;
        });
        await newSession(ctx, userId, reply, true, state.session_hash);
        reply.clearCookie(cookie, cookieOptions);
        return reply.redirect("/app");
      } catch {
        reply.clearCookie(cookie, cookieOptions);
        app.log.warn(
          { requestId: request.id, reason: failure },
          "Social sign-in did not complete",
        );
        return reply.redirect(`/app/login?auth=${failure}`);
      }
    },
  });
}
