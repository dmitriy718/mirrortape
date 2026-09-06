import { test as base, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import pg from "pg";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { unseal } from "../../server/crypto";
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
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await use();
      const expected = testInfo.annotations
        .filter((a) => a.type === "expected-console")
        .map((a) => a.description ?? "");
      const unexpected = errors.filter(
        (message) => !expected.some((pattern) => message.includes(pattern)),
      );
      expect(unexpected, "Unexpected browser errors").toEqual([]);
    },
    { auto: true },
  ],
});
test.beforeEach(async () => {
  await db.query("DELETE FROM rate_windows");
  await db.query("DELETE FROM activity");
  await db.query("DELETE FROM cohort_reservations");
});
test.afterAll(async () => db.end());
async function openWorkspace(page: Page) {
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: "Make your next move deliberate." }),
  ).toBeVisible();
}
async function saved(page: Page) {
  await expect(
    page.getByRole("status").filter({ hasText: "Saved to server" }),
  ).toBeVisible();
}
async function goToNotes(page: Page) {
  await page.getByRole("button", { name: "Explore without an email" }).click();
  await page.getByRole("button", { name: "Review my plan" }).click();
}
test("F09/F16/F18/F19 landing, guest entry, typography and responsive layout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Less noise. More intention." }),
  ).toBeVisible();
  const nav = page.locator(".product-nav");
  expect(
    await nav.evaluate((e) => getComputedStyle(e).backdropFilter),
  ).toContain("blur");
  await page.getByRole("link", { name: "Explore your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Your focus, narrowed." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".primary-button")
      .first()
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toContain("0.2s");
});
test("F01 contextual guidance dismissal persists and can be restored", async ({
  page,
}) => {
  await openWorkspace(page);
  await page.getByRole("button", { name: "Dismiss guidance" }).click();
  await saved(page);
  await page.reload();
  await expect(
    page.getByText("A workspace built around your decisions"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Show guidance" }).click();
  await expect(
    page.getByText("A workspace built around your decisions"),
  ).toBeVisible();
  await saved(page);
});
test("F04/F07/F10 email-first wizard validates, saves partial input, and survives reload", async ({
  page,
}) => {
  await openWorkspace(page);
  const email = page.getByRole("textbox", { name: "Start with your email" });
  await email.fill("partial@");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await saved(page);
  await page.reload();
  await expect(email).toHaveValue("partial@");
  await email.fill("research@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What should we call you?" })
    .fill("Jordan");
  await page.getByRole("button", { name: "Review my plan" }).click();
  await page
    .getByRole("textbox", { name: "Notes to your future self" })
    .fill("Review liquidity before making a decision.");
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Notes to your future self" }),
  ).toHaveValue("Review liquidity before making a decision.");
  await expect(
    page.getByRole("textbox", { name: "Address (optional)" }),
  ).toHaveAttribute("autocomplete", "street-address");
});
test("F02 remove and undo updates the actual persisted watchlist", async ({
  page,
}) => {
  await openWorkspace(page);
  await page.getByRole("textbox", { name: "Stock symbol" }).fill("AAPL");
  await page.getByRole("button", { name: "Add symbol", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove AAPL" })).toBeVisible();
  await page.getByRole("button", { name: "Remove AAPL" }).click();
  await expect(page.getByText("AAPL removed")).toBeVisible();
  await expect(page.getByText(/Undo within [1-5] seconds/)).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove AAPL" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove AAPL" })).toBeVisible();
});
test("F02 undo survives reload and deletion commits after the server deadline", async ({
  page,
}) => {
  await openWorkspace(page);
  await page.getByRole("textbox", { name: "Stock symbol" }).fill("MSFT");
  await page.getByRole("button", { name: "Add symbol", exact: true }).click();
  await page.getByRole("button", { name: "Remove MSFT" }).click();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Remove MSFT" }).click();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toHaveCount(0, { timeout: 10000 });
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove MSFT" })).toHaveCount(
    0,
  );
});
test("F03/F17 genuine loading steps and skeleton precede API completion", async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/draft", async (route) => {
    if (route.request().method() === "GET") {
      await gate;
      await route.continue();
    } else await route.continue();
  });
  await page.goto("/app");
  await expect(page.getByLabel("Loading your workspace")).toBeVisible();
  await expect(page.getByText("Finding your saved preferences")).toBeVisible();
  release();
  await expect(
    page.getByRole("heading", { name: "Your focus, narrowed." }),
  ).toBeVisible();
  await expect(page.getByLabel("Loading your workspace")).toHaveCount(0);
});
test("F05 failed autosave stays unsaved and one-click retry recovers", async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({
    type: "expected-console",
    description: "Failed to load resource",
  });
  await openWorkspace(page);
  await goToNotes(page);
  await saved(page);
  let fail = true;
  await page.route("**/api/draft", async (route) => {
    if (fail && route.request().method() === "PUT")
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "TEMPORARY_FAILURE",
            message: "Your changes could not be saved. Try again.",
          },
        }),
      });
    else await route.continue();
  });
  await page
    .getByRole("textbox", { name: "Notes to your future self" })
    .fill("Keep this through the network failure.");
  await expect(page.getByRole("button", { name: "Retry save" })).toBeVisible();
  await expect(
    page.getByText("Changes not saved", { exact: true }),
  ).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Retry save" }).click();
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Notes to your future self" }),
  ).toHaveValue("Keep this through the network failure.");
});
test("F04 slow older save never overwrites a newer edit", async ({ page }) => {
  await openWorkspace(page);
  await goToNotes(page);
  await saved(page);
  let first = true;
  await page.route("**/api/draft", async (route) => {
    if (route.request().method() === "PUT" && first) {
      first = false;
      await new Promise((resolve) => setTimeout(resolve, 900));
    }
    await route.continue();
  });
  const note = page.getByRole("textbox", { name: "Notes to your future self" });
  await note.fill("First version");
  await expect(
    page.getByText("Saving your changes…", { exact: true }),
  ).toBeVisible();
  await note.fill("The final version");
  await saved(page);
  await expect(page.getByText("Changes waiting to save…")).toHaveCount(0);
  await page.reload();
  await expect(note).toHaveValue("The final version");
});
test("F06 genuine aggregate activity appears only above the privacy threshold", async ({
  page,
}) => {
  for (let i = 0; i < 7; i++) {
    const id = randomUUID();
    await db.query("INSERT INTO users(id) VALUES($1)", [id]);
    await db.query("INSERT INTO activity(user_id) VALUES($1)", [id]);
  }
  await openWorkspace(page);
  await expect(page.getByLabel("Recent community activity")).toContainText(
    "5+ people",
  );
  await page
    .getByRole("button", { name: "Dismiss community activity" })
    .click();
  await expect(page.getByLabel("Recent community activity")).toHaveCount(0);
});
test("F06 no social proof is invented for an empty activity window", async ({
  page,
}) => {
  await openWorkspace(page);
  await expect(page.getByLabel("Recent community activity")).toHaveCount(0);
});
test("F08 availability badge reflects actual reserved capacity", async ({
  page,
}) => {
  await openWorkspace(page);
  await expect(page.getByText("3 cohort places available")).toBeVisible();
  const s = await page.request.get("/api/session");
  const user = s.ok() ? await s.json() : null;
  expect(user).toBeTruthy();
  await db.query("UPDATE users SET verified=true,email=$2 WHERE id=$1", [
    user.user.id,
    `${randomUUID()}@example.com`,
  ]);
  await page.reload();
  await page.getByRole("button", { name: "Reserve a place" }).click();
  await expect(page.getByText("2 cohort places available")).toBeVisible();
  await expect(page.getByText(/Your place is reserved until/)).toBeVisible();
});
test("F11 hidden public form field cannot create a watchlist record", async ({
  page,
}) => {
  await openWorkspace(page);
  const form = page
    .locator("form")
    .filter({ has: page.getByRole("textbox", { name: "Stock symbol" }) });
  await form
    .locator("input[name=website]")
    .evaluate((element: HTMLInputElement) => {
      element.value = "spam.example";
    });
  await page.getByRole("textbox", { name: "Stock symbol" }).fill("BOT");
  await page.getByRole("button", { name: "Add symbol", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove BOT" })).toHaveCount(0);
});
test("F13 CSP blocks injected inline scripts and uses restrictive headers", async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({
    type: "expected-console",
    description: "Executing inline script violates",
  });
  const response = await page.goto("/");
  const policy = response?.headers()["content-security-policy"] ?? "";
  expect(policy).toContain("script-src 'self'");
  expect(policy.match(/script-src [^;]+/)?.[0]).not.toContain("unsafe-inline");
  await page.evaluate(() => {
    const script = document.createElement("script");
    script.textContent = "document.documentElement.dataset.compromised='yes'";
    document.body.append(script);
  });
  expect(
    await page.locator("html").getAttribute("data-compromised"),
  ).toBeNull();
});
test("F20 themes follow system preference, persist override, and honor reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Color theme").selectOption("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Color theme").selectOption("system");
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page
      .locator(".primary-button")
      .first()
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("0s");
});
test("F18/F19 keyboard and contrast accessibility in light and dark", async ({
  page,
}) => {
  await openWorkspace(page);
  for (const theme of ["light", "dark"]) {
    await page.getByLabel("Color theme").selectOption(theme);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("routes, provider gates, support draft and snapshots have no false success", async ({
  page,
}, testInfo) => {
  await openWorkspace(page);
  await page.getByRole("tab", { name: "Account & billing" }).click();
  await expect(
    page.getByRole("button", { name: "Connect Alpaca paper" }),
  ).toBeDisabled();
  await expect(
    page.getByText("No brokerage accounts connected."),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Get help" }).click();
  await page
    .getByRole("textbox", { name: "Reply email" })
    .fill("support@example.com");
  await page
    .getByRole("textbox", { name: "How can we help?" })
    .fill("Please explain how I can organize my research list.");
  await saved(page);
  await page.getByRole("button", { name: "Send support request" }).click();
  await expect(
    page.getByText(/Support request saved. Your reference is/),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("workspace.png"),
    animations: "disabled",
    fullPage: true,
  });
});

test("real email queue, verification, guest upgrade, sign-in and recovery", async ({
  page,
}) => {
  const email = `browser-${randomUUID()}@example.com`;
  await openWorkspace(page);
  await page.getByRole("textbox", { name: "Stock symbol" }).fill("NVDA");
  await page.getByRole("button", { name: "Add symbol", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove NVDA" })).toBeVisible();
  await page.getByRole("link", { name: "Keep my workspace" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("A long unique test password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByText(/If this email can be registered/)).toBeVisible();
  let mail = "";
  await expect
    .poll(async () => {
      const r = await db.query(
        "SELECT encrypted_body,sent_at FROM email_outbox WHERE recipient=$1 ORDER BY created_at DESC LIMIT 1",
        [email],
      );
      if (r.rows[0]?.sent_at) {
        mail = unseal(r.rows[0].encrypted_body, process.env.ENCRYPTION_KEY!);
        return true;
      }
      return false;
    })
    .toBe(true);
  const verification = mail.match(/token=([a-f0-9]{64})/)?.[1];
  expect(verification).toBeTruthy();
  await page.goto(`/app/verify#token=${verification}`);
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(page.getByText(/Your email is verified/)).toBeVisible();
  await page.goto("/app");
  await expect(page.getByRole("button", { name: "Remove NVDA" })).toBeVisible();
  await expect(page.getByText("Email verified", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Keep my workspace" }),
  ).toBeVisible();
  await page.goto("/app/login");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("A long unique test password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove NVDA" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Keep my workspace" }),
  ).toBeVisible();
  await page.goto("/app/recover");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page
    .getByRole("button", { name: "Send recovery link", exact: true })
    .click();
  await expect(
    page.getByText(
      "If an account exists, a recovery email will arrive shortly.",
    ),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const r = await db.query(
        "SELECT encrypted_body,sent_at FROM email_outbox WHERE recipient=$1 AND subject='Reset your MirrorTape password' ORDER BY created_at DESC LIMIT 1",
        [email],
      );
      if (r.rows[0]?.sent_at) {
        mail = unseal(r.rows[0].encrypted_body, process.env.ENCRYPTION_KEY!);
        return true;
      }
      return false;
    })
    .toBe(true);
  const reset = mail.match(/token=([a-f0-9]{64})/)?.[1];
  expect(reset).toBeTruthy();
  await page.goto(`/app/reset#token=${reset}`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("My replacement test password");
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page.getByText(/Your password has been reset/)).toBeVisible();
  await page.getByRole("link", { name: "Go to sign in" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("My replacement test password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove NVDA" })).toBeVisible();
});

test("F04 navigation flushes a fresh edit before leaving the workspace", async ({
  page,
}) => {
  await openWorkspace(page);
  await goToNotes(page);
  await saved(page);
  await page
    .getByRole("textbox", { name: "Notes to your future self" })
    .fill("Save this before navigation.");
  await page.getByRole("link", { name: "Keep my workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Keep your workspace." }),
  ).toBeVisible();
  await page.goto("/app");
  await expect(
    page.getByRole("textbox", { name: "Notes to your future self" }),
  ).toHaveValue("Save this before navigation.");
});

test("F12/F14/F15 browser API requests enforce rate limits, plain text and CSRF", async ({
  page,
}) => {
  await openWorkspace(page);
  const session = await (await page.request.get("/api/session")).json();
  const headers = {
    origin: process.env.APP_ORIGIN!,
    "x-csrf-token": session.csrf,
  };
  expect(
    (
      await page.request.post("/api/watchlist", {
        headers: { origin: process.env.APP_ORIGIN! },
        data: { symbol: "AAPL" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post("/api/support", {
        headers,
        data: {
          email: "test@example.com",
          message: "<script>alert(1)</script>",
        },
      })
    ).status(),
  ).toBe(400);
  await db.query(
    "INSERT INTO rate_windows(key,hits) VALUES($1,ARRAY(SELECT now() FROM generate_series(1,90))) ON CONFLICT(key) DO UPDATE SET hits=excluded.hits",
    [`write:${session.user.id}`],
  );
  const limited = await page.request.post("/api/watchlist", {
    headers,
    data: { symbol: "AAPL" },
  });
  expect(limited.status()).toBe(429);
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
});

test("F10 optional address suggestions require consent and preserve manual fallback", async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({
    type: "expected-console",
    description: "Failed to load resource",
  });
  await page.route("**/api/session", async (route) => {
    const response = await route.fetch();
    const session = await response.json();
    session.features.address = true;
    await route.fulfill({ response, json: session });
  });
  let lookups = 0;
  await page.route("**/api/address/suggestions", async (route) => {
    lookups++;
    await route.fulfill({
      json: {
        suggestions: [
          { id: "test-place", label: "100 Main Street, Example City" },
        ],
      },
    });
  });
  await page.route("**/api/address/details", async (route) =>
    route.fulfill({
      json: { formattedAddress: "100 Main Street, Example City" },
    }),
  );
  await openWorkspace(page);
  await goToNotes(page);
  const address = page.getByRole("textbox", { name: "Address (optional)" });
  await address.fill("100 Main");
  await saved(page);
  expect(lookups).toBe(0);
  await page
    .getByRole("checkbox", {
      name: "Use Google address suggestions. What you type is sent to Google.",
    })
    .check();
  const suggestion = page.getByRole("button", {
    name: "100 Main Street, Example City",
    exact: true,
  });
  await expect(suggestion).toBeVisible();
  await suggestion.focus();
  await page.keyboard.press("Enter");
  await expect(address).toHaveValue("100 Main Street, Example City");
  await page.route("**/api/address/suggestions", async (route) =>
    route.fulfill({
      status: 503,
      json: {
        error: { code: "UNAVAILABLE", message: "Suggestions are unavailable." },
      },
    }),
  );
  await page
    .getByRole("checkbox", {
      name: "Use Google address suggestions. What you type is sent to Google.",
    })
    .check();
  await address.fill("200 Main");
  await expect(
    page.getByText(
      "Suggestions are unavailable. You can enter the address yourself.",
    ),
  ).toBeVisible();
  await saved(page);
  await page.reload();
  await expect(address).toHaveValue("200 Main");
});

test("F02 undo countdown follows server time when the device clock is wrong", async ({
  page,
}) => {
  await page.clock.setSystemTime(new Date(Date.now() + 86400000));
  await openWorkspace(page);
  await page.getByRole("textbox", { name: "Stock symbol" }).fill("AMD");
  await page.getByRole("button", { name: "Add symbol", exact: true }).click();
  await page.getByRole("button", { name: "Remove AMD" }).click();
  await expect(page.getByText(/Undo within [1-5] seconds/)).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove AMD" })).toBeVisible();
});
