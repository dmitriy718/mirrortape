import { test, expect } from "@playwright/test";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createHmac, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import pg from "pg";
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(
    process.env.DATABASE_URL ?? "postgresql://localhost/invalid",
  ).pathname.endsWith("_test")
)
  throw new Error("Dedicated test database required");
for (const signal of ["SIGTERM", "SIGINT"] as const)
  test(`real ${signal} drains a Chromium request before process exit`, async ({
    page,
  }) => {
    const reserve = createServer();
    reserve.listen(0, "127.0.0.1");
    await once(reserve, "listening");
    const address = reserve.address();
    if (!address || typeof address === "string")
      throw new Error("Loopback port unavailable");
    const port = address.port;
    await new Promise<void>((resolve) => reserve.close(() => resolve()));
    const release = `drain-${randomUUID()}`;
    const child = spawn(process.execPath, ["server-dist/index.js"], {
      env: {
        ...process.env,
        PORT: String(port),
        HOST: "127.0.0.1",
        RELEASE_ID: release,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let logs = "";
    child.stdout.on("data", (chunk) => {
      logs = (logs + chunk).slice(-12000);
    });
    child.stderr.on("data", (chunk) => {
      logs = (logs + chunk).slice(-12000);
    });
    const exited = once(child, "exit");
    const db = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
    });
    const lock = await db.connect();
    const key =
      "ip:" +
      createHmac("sha256", process.env.SESSION_SECRET!)
        .update("127.0.0.1")
        .digest("hex");
    let locked = false;
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    try {
      await expect
        .poll(async () => {
          if (child.exitCode !== null)
            throw new Error(`Early process exit: ${logs}`);
          try {
            return (
              await (
                await fetch(`http://127.0.0.1:${port}/health/ready`)
              ).json()
            ).release;
          } catch {
            return "not-ready";
          }
        })
        .toBe(release);
      await lock.query("SELECT pg_advisory_lock(hashtextextended($1,0))", [
        key,
      ]);
      locked = true;
      const request = page.goto(`http://127.0.0.1:${port}/api/public/status`);
      void request.catch(() => undefined);
      await expect
        .poll(
          async () =>
            (
              await db.query(
                "SELECT count(*)::int AS count FROM pg_stat_activity WHERE application_name=$1 AND wait_event='advisory'",
                [`mirrortape-${release}`],
              )
            ).rows[0].count,
        )
        .toBeGreaterThan(0);
      child.kill(signal);
      await expect
        .poll(async () => {
          try {
            return (
              (
                await fetch(`http://127.0.0.1:${port}/health/ready`, {
                  signal: AbortSignal.timeout(500),
                })
              ).status === 200
            );
          } catch {
            return false;
          }
        })
        .toBe(false);
      expect(
        child.exitCode,
        "The process must wait for the blocked request",
      ).toBeNull();
      await lock.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [
        key,
      ]);
      locked = false;
      const response = await request;
      expect(response?.status()).toBe(200);
      expect(await response?.json()).toMatchObject({ workspace: true });
      const [code, termination] = await exited;
      expect({ code, termination }, logs).toEqual({
        code: 0,
        termination: null,
      });
      expect(errors).toEqual([]);
    } finally {
      if (locked)
        await lock.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [
          key,
        ]);
      lock.release();
      await db.end();
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
        await exited;
      }
    }
  });

test("missing production artifacts fail startup promptly without leaking configuration", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mirrortape-startup-test-"));
  const child = spawn(process.execPath, [resolve("server-dist/index.js")], {
    cwd: directory,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (chunk) => {
    logs += chunk;
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk;
  });
  const exited = once(child, "exit");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const [code] = await Promise.race([
      exited,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Startup failure left the process running")),
          8000,
        );
      }),
    ]);
    expect(code).toBe(1);
    expect(logs).toContain("startup_initialization_failed");
    expect(logs).not.toContain(process.env.DATABASE_URL!);
    expect(logs).not.toContain(process.env.SESSION_SECRET!);
    expect(logs).not.toContain("UnhandledPromiseRejection");
  } finally {
    clearTimeout(timer);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
      await exited;
    }
  }
});
