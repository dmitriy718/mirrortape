import { describe, it, expect } from "vitest";
import { draftData } from "../../server/validation";
import { mergeDraft } from "../../src/workspace/draftMerge";
const base = draftData.parse({});
describe("draft conflict reconciliation", () => {
  it("combines edits to different fields without losing either tab's work", () => {
    const result = mergeDraft(
      base,
      { ...base, note: "Local research" },
      { ...base, email: "remote@example.com" },
    );
    expect(result.conflicts).toEqual([]);
    expect(result.data).toMatchObject({
      note: "Local research",
      email: "remote@example.com",
    });
  });
  it("requires a choice for divergent edits and preserves unrelated remote fields", () => {
    const local = { ...base, note: "This tab", name: "Local name" },
      remote = { ...base, note: "Other tab", city: "Boston" };
    expect(mergeDraft(base, local, remote).conflicts).toEqual([
      { key: "note", local: "This tab", remote: "Other tab" },
    ]);
    expect(mergeDraft(base, local, remote, "local").data).toMatchObject({
      note: "This tab",
      name: "Local name",
      city: "Boston",
    });
    expect(mergeDraft(base, local, remote, "remote").data).toMatchObject({
      note: "Other tab",
      name: "Local name",
      city: "Boston",
    });
  });
  it("treats matching edits, cleared text and false preferences as intentional values", () => {
    const previous = { ...base, note: "Earlier", shareActivity: true };
    const result = mergeDraft(
      previous,
      { ...previous, note: "", shareActivity: false },
      { ...previous, note: "" },
    );
    expect(result.conflicts).toEqual([]);
    expect(result.data).toMatchObject({ note: "", shareActivity: false });
  });
});
