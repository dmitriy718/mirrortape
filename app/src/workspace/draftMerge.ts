import type { Draft } from "./api";
export type DraftConflict = {
  key: keyof Draft;
  local: Draft[keyof Draft];
  remote: Draft[keyof Draft];
};
export function mergeDraft(
  base: Draft,
  local: Draft,
  remote: Draft,
  choice?: "local" | "remote",
) {
  const data = { ...remote };
  const conflicts: DraftConflict[] = [];
  for (const key of Object.keys(base) as (keyof Draft)[]) {
    const changedHere = local[key] !== base[key];
    const changedThere = remote[key] !== base[key];
    if (changedHere && changedThere && local[key] !== remote[key]) {
      conflicts.push({ key, local: local[key], remote: remote[key] });
      if (choice === "local") Object.assign(data, { [key]: local[key] });
    } else if (changedHere) Object.assign(data, { [key]: local[key] });
  }
  return { data, conflicts };
}
