import pg from "pg";
import type { Config } from "./config.js";
export type Database = pg.Pool;
export function database(c: Config) {
  const pool = new pg.Pool({
    connectionString: c.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
    application_name: `mirrortape-${c.RELEASE_ID}`,
  });
  pool.on("error", () => {
    process.stderr.write(
      JSON.stringify({
        level: "error",
        event: "database_idle_connection_failed",
        release: c.RELEASE_ID,
      }) + "\n",
    );
  });
  return pool;
}
export async function transaction<T>(
  db: Database,
  work: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();
  let discard = false;
  try {
    await client.query("BEGIN");
    const value = await work(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {
      discard = true;
    });
    throw error;
  } finally {
    client.release(discard);
  }
}
