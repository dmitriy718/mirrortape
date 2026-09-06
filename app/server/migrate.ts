import { readConfig } from "./config.js";
import { database } from "./db.js";
import { migrate } from "./migrations.js";
const db = database(readConfig());
try {
  await migrate(db);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Migration failed");
  process.exitCode = 1;
} finally {
  await db.end();
}
