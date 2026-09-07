import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}
for (const trusted of [false, true]) {
  test(
    trusted
      ? "only a trusted proxy may supply the client address"
      : "direct clients cannot spoof Cloudflare or forwarded headers",
    async () => {
      const upstream = createServer((request, response) => {
        response.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        response.end(
          JSON.stringify({ forwarded: request.headers["x-forwarded-for"] }),
        );
      });
      const originPort = await listen(upstream);
      const reserve = createServer();
      const proxyPort = await listen(reserve);
      await new Promise((resolve) => reserve.close(resolve));
      const directory = await mkdtemp(join(tmpdir(), "mirrortape-proxy-test-"));
      const mapping = join(directory, "upstream.caddy");
      await writeFile(
        mapping,
        `reverse_proxy 127.0.0.1:${originPort} {\n header_up X-Forwarded-For {http.vars.mirrortape_client_ip}\n}\n`,
      );
      let config = await readFile(
        new URL("../mirrortape.caddy", import.meta.url),
        "utf8",
      );
      config = config
        .replace("mirrortape.net {", `http://127.0.0.1:${proxyPort} {`)
        .replaceAll("/etc/caddy/mirrortape-upstream.caddy", mapping);
      if (trusted)
        config = config.replace(/remote_ip [^\n]+/, "remote_ip 127.0.0.1");
      const filename = join(directory, "Caddyfile");
      await writeFile(filename, "{\n admin off\n auto_https off\n}\n" + config);
      const child = spawn(
        process.env.CADDY_BIN || "caddy",
        ["run", "--config", filename],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      let logs = "",
        spawnError;
      child.stderr.on("data", (chunk) => {
        logs = (logs + chunk).slice(-16000);
      });
      child.on("error", (error) => {
        spawnError = error;
      });
      const stopped = once(child, "close");
      try {
        let response;
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline) {
          if (spawnError || child.exitCode !== null)
            throw spawnError || new Error(logs);
          try {
            response = await fetch(`http://127.0.0.1:${proxyPort}/probe`, {
              headers: {
                "CF-Connecting-IP": "203.0.113.42",
                "X-Forwarded-For": "198.51.100.99",
              },
              signal: AbortSignal.timeout(500),
            });
            break;
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
        assert(response, "Caddy did not become ready: " + logs);
        assert.equal(response.status, 200);
        assert.match(response.headers.get("cache-control"), /no-store/);
        assert.match(response.headers.get("cache-control"), /no-transform/);
        assert.equal(
          (await response.json()).forwarded,
          trusted ? "203.0.113.42" : "127.0.0.1",
        );
      } finally {
        child.kill("SIGTERM");
        await stopped;
        await new Promise((resolve) => upstream.close(resolve));
      }
    },
  );
}
