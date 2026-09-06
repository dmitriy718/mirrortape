import { spawn } from "node:child_process";
import { stat, chmod, open } from "node:fs/promises";
import { resolve } from "node:path";
const output = process.argv[2];
if (!output || !process.env.DATABASE_URL)
  throw new Error(
    "Provide a backup destination and DATABASE_URL in the environment.",
  );
const destination = resolve(output);
const url = new URL(process.env.DATABASE_URL);
const env = {
  ...process.env,
  PGHOST: url.hostname,
  PGPORT: url.port || "5432",
  PGUSER: decodeURIComponent(url.username),
  PGPASSWORD: decodeURIComponent(url.password),
  PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
  PGCONNECT_TIMEOUT: "5",
  PGSSLMODE: url.searchParams.get("sslmode") ?? "prefer",
};
// Exclusive creation prevents accidental overwrite of an existing recovery artifact.
const handle = await open(destination, "wx", 0o600);
await handle.close();
async function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: ["ignore", "ignore", "ignore"],
    });
    child.on("error", () => reject(new Error(`${command} could not start`)));
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`${command} failed; existing service remains unchanged`),
          ),
    );
  });
}
try {
  await run("pg_dump", [
    "--format=custom",
    "--no-owner",
    "--no-acl",
    "--file",
    destination,
  ]);
  await chmod(destination, 0o600);
  if ((await stat(destination)).size < 100)
    throw new Error("Backup output is unexpectedly small");
  await run("pg_restore", ["--list", destination]);
  console.log(
    "Database backup created and archive structure verified. A restore drill is still required.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
