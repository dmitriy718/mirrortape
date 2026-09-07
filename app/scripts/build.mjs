import { spawn } from "node:child_process";
const commands = [
  ["node_modules/typescript/bin/tsc", "-b"],
  ["node_modules/typescript/bin/tsc", "-p", "tsconfig.server.json"],
  ["node_modules/vite/bin/vite.js", "build"],
  [
    "node_modules/vite/bin/vite.js",
    "build",
    "--ssr",
    "src/prerender.tsx",
    "--outDir",
    ".prerender",
  ],
  ["scripts/prerender.mjs"],
];
for (const args of commands) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
  if (code !== 0) {
    process.exitCode = Number(code);
    break;
  }
}
