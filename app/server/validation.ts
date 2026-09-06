import { z } from "zod";
export const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) =>
        ![...v].some(
          (c) =>
            (c.charCodeAt(0) < 32 && !["\t", "\n", "\r"].includes(c)) ||
            c === "<" ||
            c === ">",
        ),
      "Use plain text without markup.",
    );
export const trap = { website: z.string().max(500).optional().default("") };
export const email = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
export const password = z
  .string()
  .min(15, "Use at least 15 characters.")
  .max(128);
export const draftData = z
  .object({
    symbolInput: safeText(10).default(""),
    email: safeText(254).default(""),
    name: safeText(100).default(""),
    address: safeText(250).default(""),
    city: safeText(100).default(""),
    postalCode: safeText(20).default(""),
    experience: z.enum(["new", "some", "experienced"]).default("new"),
    allocation: z.number().int().min(1).max(25).default(5),
    note: safeText(2000).default(""),
    supportMessage: safeText(4000).default(""),
    shareActivity: z.boolean().default(false),
    helpDismissed: z.boolean().default(false),
    step: z.number().int().min(0).max(2).default(0),
  })
  .strict();
export type DraftData = z.infer<typeof draftData>;
export const idParams = z.object({ id: z.uuid() }).strict();
