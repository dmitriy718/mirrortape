import Stripe from "stripe";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Context } from "../types.js";
import { requireMember } from "../security.js";
import { unavailable, AppError } from "../errors.js";
import { transaction } from "../db.js";
export async function billingRoutes(app: FastifyInstance, ctx: Context) {
  const { db, config } = ctx;
  const stripe = config.STRIPE_SECRET_KEY
    ? new Stripe(config.STRIPE_SECRET_KEY, {
        timeout: 10000,
        maxNetworkRetries: 1,
        httpClient: Stripe.createFetchHttpClient(),
      })
    : null;
  app.get("/api/billing", async (request) => {
    const r = await db.query(
      "SELECT status,updated_at FROM billing_subscriptions WHERE user_id=$1",
      [request.identity.userId],
    );
    return {
      enabled: config.BILLING_ENABLED === "true",
      status: r.rows[0]?.status ?? "none",
      updatedAt: r.rows[0]?.updated_at ?? null,
    };
  });
  app.get("/api/billing/price", async () => {
    if (!stripe || config.BILLING_ENABLED !== "true" || !config.STRIPE_PRICE_ID)
      return { available: false };
    const price = await stripe.prices.retrieve(config.STRIPE_PRICE_ID);
    if (!price.active || !price.recurring || price.unit_amount === null)
      throw unavailable("This subscription");
    return {
      available: true,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring.interval,
      intervalCount: price.recurring.interval_count,
    };
  });
  app.post("/api/billing/checkout", async (request) => {
    requireMember(request);
    z.object({}).strict().parse(request.body);
    if (!stripe || config.BILLING_ENABLED !== "true" || !config.STRIPE_PRICE_ID)
      throw unavailable("Subscription checkout");
    return transaction(db, async (client) => {
      await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE", [
        request.identity.userId,
      ]);
      const active = await client.query(
        "SELECT status FROM billing_subscriptions WHERE user_id=$1 AND status IN ('active','trialing','past_due','unpaid')",
        [request.identity.userId],
      );
      if (active.rowCount)
        throw new AppError(
          409,
          "ALREADY_SUBSCRIBED",
          "You already have a subscription. Open billing management to make changes.",
        );
      let result = await client.query(
        "SELECT customer_id FROM billing_customers WHERE user_id=$1",
        [request.identity.userId],
      );
      if (!result.rowCount) {
        const customer = await stripe.customers.create(
          {
            email: request.identity.email ?? undefined,
            metadata: { userId: request.identity.userId },
          },
          { idempotencyKey: `customer:${request.identity.userId}` },
        );
        await client.query(
          "INSERT INTO billing_customers(user_id,customer_id) VALUES($1,$2)",
          [request.identity.userId, customer.id],
        );
        result = await client.query(
          "SELECT customer_id FROM billing_customers WHERE user_id=$1",
          [request.identity.userId],
        );
      }
      const customer = result.rows[0].customer_id as string;
      const subscriptions = await stripe.subscriptions.list({
        customer,
        status: "all",
        limit: 100,
      });
      if (
        subscriptions.data.some((s) =>
          ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
            s.status,
          ),
        )
      )
        throw new AppError(
          409,
          "ALREADY_SUBSCRIBED",
          "A subscription is already active or processing. Open billing management or refresh its status.",
        );
      const open = await stripe.checkout.sessions.list({
        customer,
        status: "open",
        limit: 10,
      });
      const pending = open.data.find((s) => s.mode === "subscription");
      if (pending?.url) return { url: pending.url };
      const session = await stripe.checkout.sessions.create(
        {
          mode: "subscription",
          customer,
          client_reference_id: request.identity.userId,
          line_items: [{ price: config.STRIPE_PRICE_ID, quantity: 1 }],
          subscription_data: { metadata: { userId: request.identity.userId } },
          success_url: `${config.APP_ORIGIN}/app?billing=returned`,
          cancel_url: `${config.APP_ORIGIN}/app?billing=canceled`,
        },
        {
          idempotencyKey: `checkout:${request.identity.userId}:${Math.floor(Date.now() / 1800000)}`,
        },
      );
      if (!session.url) throw unavailable("Subscription checkout");
      return { url: session.url };
    });
  });
  app.post("/api/billing/portal", async (request) => {
    requireMember(request);
    z.object({}).strict().parse(request.body);
    if (!stripe) throw unavailable("Billing management");
    const r = await db.query(
      "SELECT customer_id FROM billing_customers WHERE user_id=$1",
      [request.identity.userId],
    );
    if (!r.rowCount)
      throw new AppError(
        409,
        "NO_BILLING",
        "There is no billing account yet. Your free workspace remains available.",
      );
    const session = await stripe.billingPortal.sessions.create({
      customer: r.rows[0].customer_id,
      return_url: `${config.APP_ORIGIN}/app`,
    });
    return { url: session.url };
  });
  await app.register(async (webhook) => {
    webhook.removeContentTypeParser("application/json");
    webhook.addContentTypeParser(
      "application/json",
      { parseAs: "buffer", bodyLimit: 262144 },
      (_req, body, done) => done(null, body),
    );
    webhook.post("/api/webhooks/stripe", async (request, reply) => {
      if (!stripe || !config.STRIPE_WEBHOOK_SECRET)
        throw unavailable("Payment notifications");
      const signature = request.headers["stripe-signature"];
      if (typeof signature !== "string" || !Buffer.isBuffer(request.body))
        throw new AppError(
          400,
          "SIGNATURE",
          "Payment notification could not be verified.",
        );
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          config.STRIPE_WEBHOOK_SECRET,
        );
      } catch {
        throw new AppError(
          400,
          "SIGNATURE",
          "Payment notification could not be verified.",
        );
      }
      await transaction(db, async (client) => {
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
          [`stripe:${event.id}`],
        );
        const r = await client.query(
          "SELECT processed_at FROM webhook_inbox WHERE event_id=$1",
          [event.id],
        );
        if (r.rows[0]?.processed_at) return;
        await client.query(
          "INSERT INTO webhook_inbox(event_id,kind) VALUES($1,$2) ON CONFLICT DO NOTHING",
          [event.id, event.type],
        );
        let customerId: string | null = null;
        if (event.type.startsWith("customer.subscription.")) {
          const sub = event.data.object as Stripe.Subscription;
          customerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        }
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          customerId =
            typeof session.customer === "string"
              ? session.customer
              : (session.customer?.id ?? null);
        }
        if (
          event.type === "invoice.paid" ||
          event.type === "invoice.payment_failed"
        ) {
          const invoice = event.data.object as Stripe.Invoice;
          customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : (invoice.customer?.id ?? null);
        }
        if (customerId) {
          // Serialize by customer and retrieve current state: old/reordered events cannot restore an obsolete entitlement.
          await client.query(
            "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
            [`billing:${customerId}`],
          );
          const owner = await client.query(
            "SELECT user_id FROM billing_customers WHERE customer_id=$1",
            [customerId],
          );
          if (!owner.rowCount)
            throw new AppError(
              503,
              "BILLING_RETRY",
              "Payment account synchronization is pending.",
            );
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            limit: 100,
          });
          if (subscriptions.has_more)
            throw unavailable("Subscription synchronization");
          const sub = subscriptions.data
            .filter((s) =>
              s.items.data.some((i) => i.price.id === config.STRIPE_PRICE_ID),
            )
            .sort((a, b) => b.created - a.created)[0];
          if (sub)
            await client.query(
              "INSERT INTO billing_subscriptions(user_id,subscription_id,status) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET subscription_id=excluded.subscription_id,status=excluded.status,updated_at=now()",
              [owner.rows[0].user_id, sub.id, sub.status],
            );
          else
            await client.query(
              "UPDATE billing_subscriptions SET status='canceled',updated_at=now() WHERE user_id=$1",
              [owner.rows[0].user_id],
            );
        }
        await client.query(
          "UPDATE webhook_inbox SET processed_at=now() WHERE event_id=$1",
          [event.id],
        );
      });
      return reply.send({ received: true });
    });
  });
}
