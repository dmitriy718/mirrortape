import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const lib = fileURLToPath(new URL("../lib/release-health.sh", import.meta.url));
const sha = "a".repeat(40);
const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'";
async function bash(script) {
  const child = spawn(
    "bash",
    ["-c", `set -uo pipefail; source ${quote(lib)}; ${script}`],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  child.stdout.on("data", (c) => (output += c));
  child.stderr.on("data", (c) => (output += c));
  const [code] = await once(child, "close");
  return { code, output };
}
for (const scenario of ["transient", "wrong-release", "malformed"])
  test(`readiness handles ${scenario} responses with a bounded deadline`, async () => {
    let calls = 0;
    const server = createServer((req, res) => {
      calls++;
      res.setHeader("Content-Type", "application/json");
      if (scenario === "transient" && calls === 1) {
        res.writeHead(503);
        res.end("{}");
      } else
        res.end(
          scenario === "malformed"
            ? "unparseable"
            : JSON.stringify({
                status: "ready",
                release: scenario === "wrong-release" ? "b".repeat(40) : sha,
              }),
        );
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const start = Date.now();
    try {
      const result = await bash(
        `release_health http://127.0.0.1:${server.address().port}/health/ready ${sha} 3`,
      );
      assert.equal(
        result.code,
        scenario === "transient" ? 0 : 1,
        result.output,
      );
      assert(Date.now() - start < 6000, "Deadline must bound failed checks");
      if (scenario === "transient") assert(calls >= 2);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
for (const fail of [false, true])
  test(`routing restoration ${fail ? "reports a reload failure" : "atomically restores the previous mapping"}`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "mirrortape-release-test-"));
    const backup = join(directory, "backup"),
      mapping = join(directory, "mapping");
    await writeFile(backup, "previous verified upstream\n");
    await writeFile(mapping, "candidate upstream\n");
    const result = await bash(
      `caddy() { return 0; }; systemctl() { return ${fail ? 1 : 0}; }; release_restore_routing ${quote(backup)} ${quote(mapping)} ${quote(join(directory, "Caddyfile"))}`,
    );
    assert.equal(result.code, fail ? 1 : 0, result.output);
    assert.equal(
      await readFile(mapping, "utf8"),
      "previous verified upstream\n",
    );
    assert.equal(
      await readFile(backup, "utf8"),
      "previous verified upstream\n",
    );
  });
test("a missing routing backup fails closed without overwriting the candidate mapping", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mirrortape-release-test-")),
    mapping = join(directory, "mapping");
  await writeFile(mapping, "candidate upstream\n");
  const result = await bash(
    `release_restore_routing ${quote(join(directory, "absent"))} ${quote(mapping)} /unused`,
  );
  assert.equal(result.code, 1);
  assert.equal(await readFile(mapping, "utf8"), "candidate upstream\n");
});

for (const scenario of ["restored", "reload-failed", "previous-unhealthy"]) {
  test(`production cleanup retains or stops the candidate safely: ${scenario}`, async () => {
    const source = await readFile(
      new URL("../vps-release.sh", import.meta.url),
      "utf8",
    );
    const cleanup = source
      .match(/cleanup\(\) \{[\s\S]*?\n\}\ntrap cleanup EXIT/)?.[0]
      .replace(/\ntrap cleanup EXIT$/, "");
    assert(cleanup, "Production cleanup function must be located exactly");
    const script = `
      started=true; switched=true; old_slot=blue; old_commit=${sha}; slot=green; config=/isolated; mapping_backup=/isolated/backup;
      log() { printf '%s\\n' "$*"; }
      release_restore_routing() { return ${scenario === "reload-failed" ? 1 : 0}; }
      health() { return ${scenario === "previous-unhealthy" ? 1 : 0}; }
      compose() { printf 'CANDIDATE_STOPPED\\n'; }
      ${cleanup}
      false
      cleanup
    `;
    const result = await bash(script);
    assert.equal(result.code, 1);
    assert.equal(
      result.output.includes("CANDIDATE_STOPPED"),
      scenario === "restored",
      result.output,
    );
    if (scenario !== "restored") assert.match(result.output, /retained/i);
  });
}
