import { readConfig } from "./config.js";
import { database } from "./db.js";
import { buildApp } from "./app.js";
const config = readConfig();
const db = database(config);
const app = await buildApp({ config, db });
let stopping = false;
async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  app.log.info({ signal }, "Graceful shutdown started");
  const timeout = setTimeout(() => {
    app.log.fatal("Shutdown deadline exceeded");
    process.exit(1);
  }, 25000);
  timeout.unref();
  try {
    await app.close();
    clearTimeout(timeout);
  } catch {
    app.log.error("Graceful shutdown failed");
    process.exitCode = 1;
  }
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
try {
  const ready = await db.query(
    "SELECT name FROM schema_migrations WHERE name=$1",
    ["002_social_auth.sql"],
  );
  if (!ready.rowCount)
    throw new Error("Run database migrations before starting.");
  await app.listen({ port: config.PORT, host: config.HOST });
} catch {
  app.log.fatal(
    "Startup failed. Check port availability, database and applied migrations.",
  );
  await app.close();
  process.exitCode = 1;
}
