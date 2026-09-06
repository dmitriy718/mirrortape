import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import {
  csrf,
  equal,
  hash,
  seal,
  unseal,
  passwordHash,
  passwordMatches,
  token,
} from "../../server/crypto";
import { readConfig } from "../../server/config";
import { draftData } from "../../server/validation";
describe("security primitives", () => {
  it("encrypts authenticated secrets and rejects tampering or another key", () => {
    const key = randomBytes(32).toString("hex");
    const encrypted = seal("broker-secret", key);
    expect(encrypted).not.toContain("broker-secret");
    expect(unseal(encrypted, key)).toBe("broker-secret");
    expect(() => unseal(encrypted, randomBytes(32).toString("hex"))).toThrow();
    expect(() =>
      unseal(
        encrypted.slice(0, -1) + (encrypted.endsWith("0") ? "1" : "0"),
        key,
      ),
    ).toThrow();
  });
  it("binds CSRF to a session and compares tokens safely", () => {
    expect(csrf("a", "key")).not.toBe(csrf("b", "key"));
    expect(equal("a", "aa")).toBe(false);
    expect(equal("a", "a")).toBe(true);
    expect(hash(token())).toHaveLength(64);
  });
  it("stores salted password hashes and rejects wrong passwords", async () => {
    const a = await passwordHash("long safe password");
    const b = await passwordHash("long safe password");
    expect(a).not.toBe(b);
    expect(await passwordMatches("long safe password", a)).toBe(true);
    expect(await passwordMatches("wrong", a)).toBe(false);
  });
  it("accepts incomplete draft emails but not executable markup or unknown fields", () => {
    expect(draftData.parse({ email: "typing@" }).email).toBe("typing@");
    expect(() =>
      draftData.parse({ note: "<script>alert(1)</script>" }),
    ).toThrow();
    expect(() => draftData.parse({ allocation: 26 })).toThrow();
    expect(() => draftData.parse({ admin: true })).toThrow();
  });
  it("fails production configuration closed without leaking supplied values", () => {
    expect(() =>
      readConfig({ APP_ORIGIN: "http://wrong", DATABASE_URL: "secret-value" }),
    ).toThrow("Configuration missing or invalid");
  });
});
