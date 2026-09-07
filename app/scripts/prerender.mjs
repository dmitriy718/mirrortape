import { readFile, writeFile, mkdir } from "node:fs/promises";
import { publicPages, posts, renderPage } from "../.prerender/prerender.js";
const template = await readFile("dist/index.html", "utf8");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
await mkdir("dist/_pages", { recursive: true });
const manifest = {};
let index = 0;
for (const [path, meta] of Object.entries(publicPages)) {
  const title = escape(`${meta.title} | MirrorTape`),
    description = escape(meta.description),
    url = "https://mirrortape.net" + path;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`)
    .replace(
      /<meta name="description"[^>]*>/,
      () => `<meta name="description" content="${description}" />`,
    )
    .replace(
      /<link rel="canonical"[^>]*>/,
      () => `<link rel="canonical" href="${url}" />`,
    )
    .replace(
      /<meta property="og:title"[^>]*>/,
      () => `<meta property="og:title" content="${title}" />`,
    )
    .replace(
      /<meta property="og:description"[^>]*>/,
      () => `<meta property="og:description" content="${description}" />`,
    )
    .replace(
      /<meta property="og:type"[^>]*>/,
      () => `<meta property="og:type" content="${meta.type ?? "website"}" />`,
    )
    .replace(
      "</head>",
      () =>
        `<meta property="og:url" content="${url}" /><meta property="og:image" content="https://mirrortape.net/social-card.png" /><meta name="twitter:card" content="summary_large_image" /><meta name="robots" content="index, follow" /></head>`,
    );
  const rendered = await renderPage(path);
  if (!rendered.includes("<h1") || rendered.includes("data-msg="))
    throw new Error(`Incomplete public rendering: ${path}`);
  html = html.replace(
    '<div id="root"></div>',
    () => `<div id="root">${rendered}</div>`,
  );
  const file = `_pages/${index++}.html`;
  manifest[path] = { file, ...meta };
  await writeFile("dist/" + file, html);
}
await writeFile("dist/site-manifest.json", JSON.stringify(manifest));
await writeFile(
  "dist/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    Object.keys(publicPages)
      .map(
        (path) => `<url><loc>https://mirrortape.net${escape(path)}</loc></url>`,
      )
      .join("") +
    "</urlset>",
);
await writeFile(
  "dist/feed.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>MirrorTape Journal</title><link>https://mirrortape.net/blog</link><description>Product guides and research habits from 625 Technologies Inc.</description><language>en-us</language>' +
    posts
      .map(
        (post) =>
          `<item><title>${escape(post.title)}</title><link>https://mirrortape.net/blog/${escape(post.slug)}</link><guid isPermaLink="true">https://mirrortape.net/blog/${escape(post.slug)}</guid><pubDate>${new Date(post.date + "T00:00:00Z").toUTCString()}</pubDate><description>${escape(post.description)}</description></item>`,
      )
      .join("") +
    "</channel></rss>",
);
console.log(
  `Rendered ${index} public pages, sitemap and ${posts.length} RSS articles.`,
);
