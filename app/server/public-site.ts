import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
export async function publicSite() {
  const manifest = z
    .record(
      z.string().regex(/^\/[a-z0-9/-]*$/),
      z.object({
        file: z.string().regex(/^_pages\/[0-9]+\.html$/),
        title: z.string(),
        description: z.string(),
        type: z.string().optional(),
      }),
    )
    .parse(
      JSON.parse(await readFile(resolve("dist/site-manifest.json"), "utf8")),
    );
  const pages = new Map<string, string>();
  for (const [path, meta] of Object.entries(manifest))
    pages.set(path, await readFile(resolve("dist", meta.file), "utf8"));
  const index = await readFile(resolve("dist/index.html"), "utf8");
  const privateHtml = index
    .replace(
      "</head>",
      '<meta name="robots" content="noindex, nofollow" /></head>',
    )
    .replace(/<link rel="canonical"[^>]*>/, "");
  return { pages, privateHtml };
}
