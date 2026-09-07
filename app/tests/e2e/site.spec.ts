import { test as base, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import pg from "pg";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { publicPages } from "../../src/content/catalog";
if (existsSync(".env.e2e")) process.loadEnvFile(".env.e2e");
if (
  process.env.NODE_ENV !== "test" ||
  !new URL(
    process.env.DATABASE_URL ?? "postgresql://localhost/invalid",
  ).pathname.endsWith("_test")
)
  throw new Error("Dedicated test database required");
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const test = base.extend<{ monitor: void }>({
  monitor: [
    async ({ page }, use, info) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await use();
      const expected = info.annotations
        .filter((a) => a.type === "expected-console")
        .map((a) => a.description ?? "");
      expect(
        errors.filter((e) => !expected.some((p) => e.includes(p))),
        "Unexpected browser errors",
      ).toEqual([]);
    },
    { auto: true },
  ],
});
test.beforeEach(async () => {
  await db.query("DELETE FROM rate_windows");
});
test.afterAll(async () => db.end());

test("published company, policy and article pages have metadata and fit the viewport", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const route of Object.entries(publicPages)
    .map(([path, meta]) => ({ path, ...meta }))
    .filter(
      (p) =>
        [
          "/about",
          "/terms",
          "/privacy",
          "/cookies",
          "/accessibility",
          "/security",
          "/refunds",
          "/changelog",
          "/contact",
          "/blog",
          "/status",
        ].includes(p.path) || p.path.startsWith("/blog/"),
    )) {
    const response = await page.goto(route.path);
    expect(response?.status(), route.path).toBe(200);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page).toHaveTitle(`${route.title} | MirrorTape`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://mirrortape.net${route.path}`,
    );
    await expect(page.locator("footer")).toContainText("625 Technologies Inc.");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route.path,
    ).toBe(true);
  }
});

test("journal filters, empty recovery, article navigation and focus work", async ({
  page,
}) => {
  await page.goto("/blog");
  await expect(page.locator(".journal-card")).toHaveCount(4);
  await page.getByLabel("Browse by topic").selectOption("Product guides");
  await expect(page.locator(".journal-card")).toHaveCount(2);
  await page.getByLabel("Search the journal").fill("no-matching-article-92841");
  await expect(
    page.getByRole("heading", { name: "No matching articles." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".journal-card")).toHaveCount(4);
  await page.locator(".journal-card h2 a").first().click();
  await expect(page).toHaveURL(/\/blog\/a-watchlist-with-a-purpose$/);
  await expect(page.locator("main")).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Article contents" }),
  ).toBeVisible();
  await expect(page.locator(".related-reading a")).toHaveCount(2);
  const feed = await page.request.get("/feed.xml");
  expect((await feed.text()).match(/<item>/g)).toHaveLength(4);
});

test("public contact autosaves and retry after a lost response creates one request", async ({
  page,
}, info) => {
  info.annotations.push({
    type: "expected-console",
    description: "net::ERR_FAILED",
  });
  const email = `contact-${randomUUID()}@example.com`;
  await page.goto("/contact?topic=Privacy");
  await page.getByLabel("Topic", { exact: true }).selectOption("Accessibility");
  await page.getByLabel("Reply email (required)").fill(email);
  await page
    .getByLabel("Your message (required)")
    .fill("Please help me use keyboard navigation in my workspace.");
  await expect(
    page.getByRole("status").filter({ hasText: "Saved to server" }),
  ).toBeVisible();
  await page.goto("/contact");
  await expect(page.getByLabel("Topic", { exact: true })).toHaveValue(
    "Accessibility",
  );
  await expect(page.getByLabel("Reply email (required)")).toHaveValue(email);
  await expect(page.getByLabel("Your message (required)")).toHaveValue(
    "Please help me use keyboard navigation in my workspace.",
  );
  let intercepted = false;
  await page.route("**/api/support", async (route) => {
    if (!intercepted) {
      intercepted = true;
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await page.getByRole("button", { name: "Retry sending" }).click();
  await expect(
    page.getByRole("heading", { name: "Your request has been received." }),
  ).toBeVisible();
  const rows = (
    await db.query("SELECT id,message FROM support_cases WHERE email=$1", [
      email,
    ])
  ).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0].message).toBe(
    "Accessibility: Please help me use keyboard navigation in my workspace.",
  );
  await expect(page.locator(".request-reference")).toHaveText(rows[0].id);
});

test("status exposes actual gates and recovers from an unavailable check", async ({
  page,
}, info) => {
  info.annotations.push({
    type: "expected-console",
    description: "503 (Service Unavailable)",
  });
  await page.route(
    "**/api/public/status",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "temporarily unavailable" }),
      }),
    { times: 1 },
  );
  await page.goto("/status");
  await page.getByRole("button", { name: "Retry service check" }).click();
  await expect(
    page.getByRole("heading", { name: "Workspace is responding" }),
  ).toBeVisible();
  await expect(
    page.locator(".status-list > div").filter({ hasText: "Paid memberships" }),
  ).toContainText("Not available");
  await page.getByRole("button", { name: "Refresh status" }).click();
  await expect(
    page.getByRole("heading", { name: "Workspace is responding" }),
  ).toBeVisible();
});

test("policy, journal and contact pages pass automated accessibility in both themes", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const theme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: theme as "light" | "dark" });
    for (const path of ["/privacy", "/blog", "/contact"]) {
      await page.goto(path);
      if (path === "/contact")
        await expect(page.getByLabel("Reply email (required)")).toBeVisible();
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations, `${path} ${theme}`).toEqual([]);
    }
  }
});

test("policy text and links remain readable with JavaScript disabled", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const response = await page.goto(`${baseURL}/privacy`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".reading-body")).toContainText(
      "625 Technologies Inc.",
    );
    await page.locator('main a[href="/contact?topic=Privacy"]').first().click();
    await expect(page.locator("main h1")).toBeVisible();
    expect((await page.request.get(`${baseURL}/blog/missing`)).status()).toBe(
      404,
    );
  } finally {
    await context.close();
  }
});
