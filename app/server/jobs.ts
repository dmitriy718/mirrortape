import nodemailer from "nodemailer";
import type { FastifyInstance } from "fastify";
import type { Context } from "./types.js";
import { transaction } from "./db.js";
import { unseal } from "./crypto.js";
export function jobs(app: FastifyInstance, ctx: Context) {
  const smtp = ctx.config.SMTP_URL ? new URL(ctx.config.SMTP_URL) : null;
  const transport = smtp
    ? nodemailer.createTransport({
        host: smtp.hostname,
        port: Number(smtp.port || (smtp.protocol === "smtps:" ? 465 : 587)),
        secure: smtp.protocol === "smtps:",
        requireTLS: ctx.config.NODE_ENV === "production",
        auth: smtp.username
          ? {
              user: decodeURIComponent(smtp.username),
              pass: decodeURIComponent(smtp.password),
            }
          : undefined,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      })
    : null;
  let running: Promise<void> | null = null;
  const tick = async () => {
    await ctx.db.query("DELETE FROM watchlist WHERE delete_at<=now()");
    await ctx.db.query("DELETE FROM sessions WHERE expires_at<now()");
    await ctx.db.query(
      "DELETE FROM rate_windows WHERE updated_at<now()-interval '2 hours'",
    );
    if (!transport) return;
    await transaction(ctx.db, async (client) => {
      const r = await client.query(
        "SELECT id,recipient,subject,encrypted_body FROM email_outbox WHERE sent_at IS NULL AND attempts<5 AND next_attempt<=now() ORDER BY next_attempt LIMIT 1 FOR UPDATE SKIP LOCKED",
      );
      if (!r.rowCount) return;
      const row = r.rows[0];
      try {
        await transport.sendMail({
          from: ctx.config.MAIL_FROM,
          to: row.recipient,
          subject: row.subject,
          text: unseal(row.encrypted_body, ctx.config.ENCRYPTION_KEY),
          messageId: `<${row.id}@mirrortape.net>`,
        });
        await client.query(
          "UPDATE email_outbox SET sent_at=now(),attempts=attempts+1 WHERE id=$1",
          [row.id],
        );
      } catch {
        await client.query(
          "UPDATE email_outbox SET attempts=attempts+1,next_attempt=now()+make_interval(secs=>least(900,30*power(2,attempts)::integer)) WHERE id=$1",
          [row.id],
        );
        app.log.warn(
          { jobId: row.id },
          "Email delivery failed; retry scheduled",
        );
      }
    });
  };
  const timer = setInterval(() => {
    if (!running)
      running = tick()
        .catch(() =>
          app.log.error(
            "Background maintenance failed; check database and email health",
          ),
        )
        .finally(() => {
          running = null;
        });
  }, 1000);
  timer.unref();
  app.addHook("onClose", async () => {
    clearInterval(timer);
    await running;
    transport?.close();
  });
}
