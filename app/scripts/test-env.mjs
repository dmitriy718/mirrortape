import { existsSync } from "node:fs";
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(
    process.env.DATABASE_URL ?? "postgresql://localhost/invalid",
  ).pathname.endsWith("_test")
)
  throw new Error(
    "Tests require NODE_ENV=test and a dedicated DATABASE_URL ending in _test.",
  );
