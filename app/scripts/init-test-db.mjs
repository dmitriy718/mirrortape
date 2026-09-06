import { existsSync, writeFileSync, chmodSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import pg from "pg";
import { parseEnv } from "node:util";
if (existsSync(".env")) process.loadEnvFile(".env");
if (!process.env.DATABASE_URL)
  throw new Error(
    "Set DATABASE_URL for a local PostgreSQL development cluster.",
  );
const url = new URL(process.env.DATABASE_URL);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
  throw new Error(
    "Automatic test database creation is restricted to local PostgreSQL. Provision a dedicated test database explicitly in CI.",
  );
url.pathname = "/postgres";
const pool = new pg.Pool({ connectionString: url.toString() });
try {
  const existing = await pool.query(
    "SELECT 1 FROM pg_database WHERE datname='mirrortape_test'",
  );
  if (!existing.rowCount) await pool.query("CREATE DATABASE mirrortape_test");
  url.pathname = "/mirrortape_test";
  if (existsSync(".env.e2e")) {
    const existingConfig = parseEnv(readFileSync(".env.e2e", "utf8"));
    if (
      existingConfig.NODE_ENV !== "test" ||
      existingConfig.DATABASE_URL !== url.toString()
    )
      throw new Error(
        "Existing test configuration points to a different database; review it before proceeding.",
      );
    chmodSync(".env.e2e", 0o600);
    console.log(
      "Existing isolated test configuration retained; no keys were rotated.",
    );
  } else {
    const values = {
      NODE_ENV: "test",
      DATABASE_URL: url.toString(),
      APP_ORIGIN: "http://127.0.0.1:3110",
      PORT: "3110",
      SESSION_SECRET: randomBytes(48).toString("hex"),
      ENCRYPTION_KEY: randomBytes(32).toString("hex"),
      COHORT_CAPACITY: "3",
      RELEASE_ID: "e2e",
      SMTP_URL: "smtp://127.0.0.1:3325",
      MAIL_FROM: "test@mirrortape.net",
    };
    writeFileSync(
      ".env.e2e",
      Object.entries(values)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n") + "\n",
      { mode: 0o600 },
    );
    chmodSync(".env.e2e", 0o600);
    console.log(
      "Isolated test database configuration written; credentials were not printed.",
    );
  }
} finally {
  await pool.end();
}
