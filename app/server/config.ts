import { z } from "zod";
const blank = (value: unknown) => (value === "" ? undefined : value);
const optional = z.preprocess(blank, z.string().optional());
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3100),
  HOST: z.enum(["127.0.0.1", "0.0.0.0"]).default("127.0.0.1"),
  APP_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().startsWith("postgres"),
  SESSION_SECRET: z.string().min(48),
  ENCRYPTION_KEY: z.string().regex(/^[a-f0-9]{64}$/),
  TRUST_PROXY_ADDRESS: z.preprocess(blank, z.ipv4().optional()),
  TRUST_PROXY: z.enum(["false", "loopback"]).default("false"),
  RELEASE_ID: z
    .string()
    .regex(/^[a-zA-Z0-9._-]{1,80}$/)
    .default("local"),
  SMTP_URL: z.preprocess(
    blank,
    z
      .string()
      .url()
      .refine((value) => ["smtp:", "smtps:"].includes(new URL(value).protocol))
      .optional(),
  ),
  MAIL_FROM: z.preprocess(blank, z.string().email().optional()),
  STRIPE_SECRET_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,
  STRIPE_PRICE_ID: optional,
  BILLING_ENABLED: z.enum(["true", "false"]).default("false"),
  ALPACA_CLIENT_ID: optional,
  ALPACA_CLIENT_SECRET: optional,
  ALPACA_COMMERCIAL_APPROVED: z.enum(["true", "false"]).default("false"),
  GOOGLE_PLACES_API_KEY: optional,
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  APPLE_CLIENT_ID: optional,
  APPLE_TEAM_ID: optional,
  APPLE_KEY_ID: optional,
  APPLE_PRIVATE_KEY_BASE64: optional,
  FACEBOOK_CLIENT_ID: optional,
  FACEBOOK_CLIENT_SECRET: optional,
  FACEBOOK_GRAPH_VERSION: z.preprocess(
    blank,
    z
      .string()
      .regex(/^v[0-9]{2}\.0$/)
      .optional(),
  ),
  COHORT_CAPACITY: z.coerce.number().int().min(0).max(100000).default(0),
  COHORT_END: z.preprocess(blank, z.iso.datetime().optional()),
  LEGAL_TERMS_URL: z.preprocess(blank, z.string().url().optional()),
  LEGAL_PRIVACY_URL: z.preprocess(blank, z.string().url().optional()),
});
export type Config = z.infer<typeof schema>;
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = schema.safeParse(env);
  if (!result.success)
    throw new Error(
      `Configuration missing or invalid: ${[...new Set(result.error.issues.map((i) => i.path[0]))].join(", ")}. See .env.example.`,
    );
  const c = result.data;
  const origin = new URL(c.APP_ORIGIN);
  if (origin.origin !== c.APP_ORIGIN)
    throw new Error(
      "APP_ORIGIN must be an origin without a path or trailing slash.",
    );
  if (c.NODE_ENV === "production" && c.APP_ORIGIN !== "https://mirrortape.net")
    throw new Error("Production requires APP_ORIGIN=https://mirrortape.net.");
  if (
    c.BILLING_ENABLED === "true" &&
    (!c.STRIPE_SECRET_KEY ||
      !c.STRIPE_PRICE_ID ||
      !c.STRIPE_WEBHOOK_SECRET ||
      !c.LEGAL_TERMS_URL ||
      !c.LEGAL_PRIVACY_URL)
  )
    throw new Error(
      "Billing requires Stripe credentials, a price and approved legal document URLs.",
    );
  if (Boolean(c.SMTP_URL) !== Boolean(c.MAIL_FROM))
    throw new Error("SMTP_URL and MAIL_FROM must be configured together.");
  for (const keys of [
    ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    [
      "APPLE_CLIENT_ID",
      "APPLE_TEAM_ID",
      "APPLE_KEY_ID",
      "APPLE_PRIVATE_KEY_BASE64",
    ],
    ["FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET", "FACEBOOK_GRAPH_VERSION"],
  ] as const) {
    const count = keys.filter((key) => Boolean(c[key])).length;
    if (count && count !== keys.length)
      throw new Error(
        `Configure all provider settings together: ${keys.join(", ")}.`,
      );
  }
  return c;
}
