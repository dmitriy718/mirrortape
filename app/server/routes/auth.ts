import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Context } from "../types.js";
import { email, password, trap } from "../validation.js";
import { token, hash, seal, passwordHash, passwordMatches } from "../crypto.js";
import { AppError, unavailable } from "../errors.js";
import { transaction } from "../db.js";
import { cookieName, newSession, slidingLimit } from "../security.js";
export async function authRoutes(app: FastifyInstance, ctx: Context) {
  const { db, config } = ctx;
  app.get("/api/auth/status", async (request) => ({
    authenticated: request.identity.authenticated,
  }));
  const dummyHash = await passwordHash(token());
  app.post("/api/auth/register", async (request, reply) => {
    const body = z
      .object({ email, password, ...trap })
      .strict()
      .parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    const wait = await slidingLimit(ctx, `email:${hash(body.email)}`, 4, 3600);
    if (wait)
      throw new AppError(
        429,
        "RATE_LIMIT",
        "Please wait before requesting another email.",
        wait,
      );
    const encoded = await passwordHash(body.password);
    const verification = token();
    const created = await transaction(db, async (client) => {
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        [`register:${body.email}`],
      );
      const account = await client.query(
        "SELECT email FROM users WHERE id=$1 FOR UPDATE",
        [request.identity.userId],
      );
      if (account.rows[0]?.email)
        throw new AppError(
          409,
          "ACCOUNT_EXISTS",
          "This session already has an account. Sign in or recover access.",
        );
      const existing = await client.query(
        "SELECT id FROM users WHERE email=$1",
        [body.email],
      );
      if (existing.rowCount) return false;
      await client.query(
        "UPDATE users SET email=$2,password_hash=$3 WHERE id=$1",
        [request.identity.userId, body.email, encoded],
      );
      if (config.SMTP_URL) {
        await client.query(
          "INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,'verify',now()+interval '30 minutes')",
          [hash(verification), request.identity.userId],
        );
        const message = `Verify your MirrorTape email by opening ${config.APP_ORIGIN}/app/verify#token=${verification}\nThis link expires in 30 minutes. If you did not request it, ignore this email.`;
        await client.query(
          "INSERT INTO email_outbox(id,recipient,subject,encrypted_body) VALUES($1,$2,$3,$4)",
          [
            randomUUID(),
            body.email,
            "Verify your MirrorTape email",
            seal(message, config.ENCRYPTION_KEY),
          ],
        );
      }
      return true;
    });
    if (created) {
      await newSession(
        ctx,
        request.identity.userId,
        reply,
        true,
        request.identity.sessionHash,
      );
    }
    return {
      created,
      verificationAvailable: Boolean(config.SMTP_URL),
      accepted: true,
      message:
        "If this email can be registered, a verification link will arrive shortly. Check your inbox or sign in to your existing account.",
    };
  });
  app.post("/api/auth/verify", async (request, reply) => {
    const body = z
      .object({ token: z.string().regex(/^[a-f0-9]{64}$/), ...trap })
      .strict()
      .parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    await transaction(db, async (client) => {
      const r = await client.query(
        "UPDATE auth_tokens SET used_at=now() WHERE token_hash=$1 AND purpose='verify' AND used_at IS NULL AND expires_at>now() RETURNING user_id",
        [hash(body.token)],
      );
      if (!r.rowCount)
        throw new AppError(
          400,
          "LINK_EXPIRED",
          "This verification link has expired or was already used. Request a new email.",
        );
      await client.query("UPDATE users SET verified=true WHERE id=$1", [
        r.rows[0].user_id,
      ]);
      await client.query(
        "INSERT INTO audit_events(user_id,action) VALUES($1,'email_verified')",
        [r.rows[0].user_id],
      );
    });
    return { verified: true };
  });
  app.post("/api/auth/resend", async (request, reply) => {
    const body = z
      .object({ email, ...trap })
      .strict()
      .parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    if (!config.SMTP_URL) throw unavailable("Email verification");
    const wait = await slidingLimit(ctx, `resend:${hash(body.email)}`, 3, 3600);
    if (wait)
      throw new AppError(
        429,
        "RATE_LIMIT",
        "Please wait before requesting another verification email.",
        wait,
      );
    await transaction(db, async (client) => {
      const account = await client.query(
        "SELECT id FROM users WHERE email=$1 AND verified=false FOR UPDATE",
        [body.email],
      );
      if (!account.rowCount) return;
      const secret = token();
      await client.query(
        "UPDATE auth_tokens SET used_at=now() WHERE user_id=$1 AND purpose='verify' AND used_at IS NULL",
        [account.rows[0].id],
      );
      await client.query(
        "INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,'verify',now()+interval '30 minutes')",
        [hash(secret), account.rows[0].id],
      );
      await client.query(
        "INSERT INTO email_outbox(id,recipient,subject,encrypted_body) VALUES($1,$2,$3,$4)",
        [
          randomUUID(),
          body.email,
          "Verify your MirrorTape email",
          seal(
            `Verify your email: ${config.APP_ORIGIN}/app/verify#token=${secret}\nThis link expires in 30 minutes.`,
            config.ENCRYPTION_KEY,
          ),
        ],
      );
    });
    return {
      accepted: true,
      message:
        "If this account needs verification, a new email will arrive shortly.",
    };
  });
  app.post("/api/auth/login", async (request, reply) => {
    const body = z
      .object({ email, password: z.string().min(1).max(128), ...trap })
      .strict()
      .parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    const wait = await slidingLimit(ctx, `login:${hash(body.email)}`, 10, 600);
    if (wait)
      throw new AppError(
        429,
        "RATE_LIMIT",
        "Please wait before trying this account again.",
        wait,
      );
    const r = await db.query(
      "SELECT id,password_hash,verified FROM users WHERE email=$1",
      [body.email],
    );
    const user = r.rows[0];
    const matches = await passwordMatches(
      body.password,
      user?.password_hash ?? dummyHash,
    );
    if (!matches || !user)
      throw new AppError(
        401,
        "LOGIN_FAILED",
        "The email or password does not match. Check them or reset your password.",
      );
    let currentHash = user.password_hash as string;
    if (!user.password_hash.startsWith("scrypt-v1:")) {
      const upgraded = await passwordHash(body.password);
      currentHash = upgraded;
      await db.query(
        "UPDATE users SET password_hash=$2 WHERE id=$1 AND password_hash=$3",
        [user.id, upgraded, user.password_hash],
      );
    }
    await newSession(
      ctx,
      user.id,
      reply,
      true,
      request.identity.sessionHash,
      currentHash,
    );
    await db.query(
      "INSERT INTO audit_events(user_id,action) VALUES($1,'signed_in')",
      [user.id],
    );
    return { signedIn: true };
  });
  app.post("/api/auth/logout", async (request, reply) => {
    z.object({})
      .strict()
      .parse(request.body ?? {});
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [
      request.identity.sessionHash,
    ]);
    reply.clearCookie(cookieName(config.NODE_ENV === "production"), {
      path: "/",
    });
    return { signedOut: true };
  });
  app.post("/api/auth/recover", async (request, reply) => {
    const body = z
      .object({ email, ...trap })
      .strict()
      .parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    if (!config.SMTP_URL) throw unavailable("Email recovery");
    const wait = await slidingLimit(
      ctx,
      `recover:${hash(body.email)}`,
      3,
      3600,
    );
    if (wait)
      throw new AppError(
        429,
        "RATE_LIMIT",
        "Please wait before requesting another recovery email.",
        wait,
      );
    const r = await db.query("SELECT id FROM users WHERE email=$1", [
      body.email,
    ]);
    if (r.rowCount) {
      const secret = token();
      await transaction(db, async (client) => {
        await client.query(
          "INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,'reset',now()+interval '15 minutes')",
          [hash(secret), r.rows[0].id],
        );
        await client.query(
          "INSERT INTO email_outbox(id,recipient,subject,encrypted_body) VALUES($1,$2,$3,$4)",
          [
            randomUUID(),
            body.email,
            "Reset your MirrorTape password",
            seal(
              `Reset your password: ${config.APP_ORIGIN}/app/reset#token=${secret}\nThis link expires in 15 minutes. Ignore it if you did not request a reset.`,
              config.ENCRYPTION_KEY,
            ),
          ],
        );
      });
    }
    return {
      accepted: true,
      message: "If an account exists, a recovery email will arrive shortly.",
    };
  });
  app.post("/api/auth/reset", async (request, reply) => {
    const body = z
      .object({ token: z.string().regex(/^[a-f0-9]{64}$/), password, ...trap })
      .strict()
      .parse(request.body);
    if (body.website) return reply.code(202).send({ accepted: true });
    const encoded = await passwordHash(body.password);
    await transaction(db, async (client) => {
      const r = await client.query(
        "UPDATE auth_tokens SET used_at=now() WHERE token_hash=$1 AND purpose='reset' AND used_at IS NULL AND expires_at>now() RETURNING user_id",
        [hash(body.token)],
      );
      if (!r.rowCount)
        throw new AppError(
          400,
          "LINK_EXPIRED",
          "This recovery link has expired or was already used. Request a new one.",
        );
      const id = r.rows[0].user_id;
      await client.query("UPDATE users SET password_hash=$2 WHERE id=$1", [
        id,
        encoded,
      ]);
      await client.query("DELETE FROM sessions WHERE user_id=$1", [id]);
      await client.query(
        "UPDATE auth_tokens SET used_at=now() WHERE user_id=$1 AND purpose='reset' AND used_at IS NULL",
        [id],
      );
      await client.query(
        "INSERT INTO audit_events(user_id,action) VALUES($1,'password_reset')",
        [id],
      );
    });
    return { reset: true };
  });
}
