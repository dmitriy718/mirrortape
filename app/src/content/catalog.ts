import { documents } from "./documents";
import { posts } from "./posts";
export type PageMeta = {
  title: string;
  description: string;
  type?: "article";
  noindex?: boolean;
};
export const publicPages: Record<string, PageMeta> = {
  "/": {
    title: "Your trading research workspace",
    description:
      "Organize your research watchlist and personal plan. A MirrorTape product by 625 Technologies Inc. Explore the free demo without a brokerage connection.",
  },
  "/how-it-works": {
    title: "How MirrorTape works",
    description:
      "Build a research list, write your own plan, and understand the boundary between a demo and your private workspace.",
  },
  "/pricing": {
    title: "Pricing and free access",
    description:
      "Start with MirrorTape's free research workspace. See what is included and whether paid memberships are currently available.",
  },
  "/risk": {
    title: "Risk and product boundaries",
    description:
      "Understand what MirrorTape's research tools and read-only connections do, and what they do not do.",
  },
  "/faq": {
    title: "Frequently asked questions",
    description:
      "Answers about accounts, saving, the demo, watchlists and provider connections.",
  },
  "/support": {
    title: "Help center",
    description:
      "Help with saved drafts, account access, and MirrorTape provider connections.",
  },
  "/traders": {
    title: "Trader availability",
    description:
      "Understand the current availability of trader discovery and copy execution on MirrorTape.",
  },
  "/demo": {
    title: "Interactive demo dashboard",
    description:
      "Try MirrorTape's separate practice watchlist and note without opening an account or connecting a broker.",
  },
  "/contact": {
    title: "Contact 625 Technologies Inc.",
    description:
      "Send an account, privacy, accessibility, security, billing or general request to the operator of MirrorTape.",
  },
  "/status": {
    title: "Service status",
    description:
      "Check current workspace availability and enabled MirrorTape integrations. No invented uptime history.",
  },
  "/blog": {
    title: "The MirrorTape Journal",
    description:
      "Practical product guides and thoughtful research habits, written for a clearer workspace.",
  },
  ...Object.fromEntries(
    Object.entries(documents).map(([path, doc]) => [
      path,
      { title: doc.title, description: doc.description },
    ]),
  ),
  ...Object.fromEntries(
    posts.map((post) => [
      `/blog/${post.slug}`,
      {
        title: post.title,
        description: post.description,
        type: "article" as const,
      },
    ]),
  ),
};
export function metadata(path: string): PageMeta {
  const normalized = path.replace(/\/$/, "") || "/";
  return (
    publicPages[normalized] ?? {
      title: normalized.startsWith("/app")
        ? "Your secure account"
        : "Page not found",
      description:
        "Access your MirrorTape account or return to the public website.",
      noindex: true,
    }
  );
}
