import "./test-env.mjs";
import { readConfig } from "../server-dist/config.js";
import { database } from "../server-dist/db.js";
import { migrate } from "../server-dist/migrations.js";
const db = database(readConfig());
try {
  await migrate(db);
} finally {
  await db.end();
}
import { SMTPServer } from "smtp-server";
const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ["AUTH", "STARTTLS"],
  onData(stream, _session, callback) {
    stream.on("data", () => {});
    stream.on("end", () => callback());
  },
});
await new Promise((resolve, reject) => {
  smtp.once("error", reject);
  smtp.listen(3325, "127.0.0.1", resolve);
});
process.on("SIGTERM", () => smtp.close());
process.on("SIGINT", () => smtp.close());
await import("../server-dist/index.js");
