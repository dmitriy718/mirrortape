import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const origin = new URL(process.env.SMOKE_ORIGIN || "https://mirrortape.net")
  .origin;
const browser = await chromium.launch({ headless: true });
const results = [],
  errors = [];
await mkdir("test-results", { recursive: true });
try {
  for (const [device, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error")
        errors.push({ device, message: message.text() });
    });
    page.on("pageerror", (error) =>
      errors.push({ device, message: error.message }),
    );
    for (const route of [
      "/",
      "/how-it-works",
      "/pricing",
      "/risk",
      "/faq",
      "/demo",
      "/about",
      "/terms",
      "/privacy",
      "/cookies",
      "/accessibility",
      "/security",
      "/refunds",
      "/changelog",
      "/contact",
      "/status",
      "/blog",
      "/blog/a-watchlist-with-a-purpose",
      "/blog/what-saved-actually-means",
      "/blog/demo-and-private-workspace",
      "/blog/a-weekly-workspace-review",
      "/app/login",
      "/app/register",
      "/app",
    ]) {
      const response = await page.goto(origin + route);
      assert.equal(response.status(), 200, route);
      await page.locator("h1").first().waitFor();
      await page.waitForLoadState("networkidle");
      if (route === "/app")
        assert.equal(new URL(page.url()).pathname, "/app/login");
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        route + " overflow",
      );
      if (["/", "/how-it-works", "/pricing", "/risk", "/faq"].includes(route))
        assert.equal(
          await page.getByRole("region", { name: "Next step" }).count(),
          1,
        );
      if (
        [
          "/demo",
          "/app/register",
          "/blog",
          "/about",
          "/contact",
          "/terms",
        ].includes(route)
      )
        await page.screenshot({
          path:
            "test-results/public-" +
            device +
            route.replaceAll("/", "-") +
            ".png",
          fullPage: true,
        });
      results.push({
        device,
        route,
        status: response.status(),
        heading: await page.locator("h1").first().innerText(),
      });
    }
    const session = (await context.cookies()).find(
      (cookie) =>
        cookie.name ===
        (origin.startsWith("https:") ? "__Host-mirrortape" : "mirrortape"),
    );
    assert(session && session.httpOnly && session.sameSite === "Lax");
    if (origin.startsWith("https:")) assert(session.secure);
    await context.close();
  }
  assert.deepEqual(errors, [], "Public browser console must remain clean");
  console.log(
    JSON.stringify({
      origin,
      passed: results.length,
      consoleErrors: 0,
      privateRouteGuard: true,
    }),
  );
} catch (error) {
  process.exitCode = 1;
  console.error(error.message);
} finally {
  await writeFile(
    "test-results/public-smoke.json",
    JSON.stringify(
      { origin, passed: !process.exitCode, results, errors },
      null,
      2,
    ),
  );
  await browser.close();
}
