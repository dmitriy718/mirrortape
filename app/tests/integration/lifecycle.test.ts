import { it, expect, vi } from "vitest";
import { existsSync } from "node:fs";
import { readConfig } from "../../server/config";
import { database } from "../../server/db";
import { buildApp } from "../../server/app";
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
const config = readConfig();
if (
  config.NODE_ENV !== "test" ||
  !new URL(config.DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Dedicated test database required");
it("drains an active maintenance query before closing the real database pool", async () => {
  const db = database(config);
  let release!: () => void, started!: () => void, enteredClose!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const active = new Promise<void>((resolve) => {
    started = resolve;
  });
  const closing = new Promise<void>((resolve) => {
    enteredClose = resolve;
  });
  const query = db.query.bind(db);
  let held = false,
    released = false;
  vi.spyOn(db, "query").mockImplementation((async (
    ...args: Parameters<typeof db.query>
  ) => {
    if (
      !held &&
      args[0] === "DELETE FROM social_auth_states WHERE expires_at<now()"
    ) {
      held = true;
      started();
      await gate;
      released = true;
    }
    return query(...args);
  }) as typeof db.query);
  const end = db.end.bind(db);
  const endSpy = vi.spyOn(db, "end").mockImplementation(async () => {
    expect(
      released,
      "Database must remain open while maintenance is active",
    ).toBe(true);
    await end();
  });
  const app = await buildApp({ config, db });
  app.addHook("onClose", async () => {
    enteredClose();
  });
  await app.ready();
  let close: Promise<void> | undefined;
  try {
    await active;
    close = app.close();
    void close.catch(() => undefined);
    await closing;
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(endSpy).not.toHaveBeenCalled();
  } finally {
    release();
    await (close ?? app.close());
    vi.restoreAllMocks();
  }
  expect(released).toBe(true);
});
