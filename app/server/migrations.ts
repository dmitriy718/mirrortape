import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { Database } from "./db.js";
import { transaction } from "./db.js";
export async function migrate(db: Database) {
  await transaction(db, async (client) => {
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SET LOCAL statement_timeout='30s'");
    await client.query("SELECT pg_advisory_xact_lock(71824001)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const directory = resolve("server/migrations");
    for (const name of (await readdir(directory))
      .filter((f) => /^\d+_[a-z0-9_]+\.sql$/.test(f))
      .sort()) {
      const sql = await readFile(resolve(directory, name), "utf8");
      const hash = createHash("sha256").update(sql).digest("hex");
      const previous = await client.query(
        "SELECT checksum FROM schema_migrations WHERE name=$1",
        [name],
      );
      if (previous.rowCount) {
        if (previous.rows[0].checksum !== hash)
          throw new Error(`Migration checksum changed: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",
        [name, hash],
      );
      process.stdout.write(`${new Date().toISOString()} applied ${name}\n`);
    }
  });
}
