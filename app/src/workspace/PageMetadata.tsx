import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { metadata } from "../content/catalog";
export default function PageMetadata() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(pathname);
  useEffect(() => {
    const meta = metadata(pathname);
    const title = `${meta.title} | MirrorTape`;
    document.title = title;
    const set = (attribute: string, key: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${key}"]`,
      );
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = value;
    };
    set("name", "description", meta.description);
    set("name", "robots", meta.noindex ? "noindex, nofollow" : "index, follow");
    set("property", "og:title", title);
    set("property", "og:description", meta.description);
    set("property", "og:type", meta.type ?? "website");
    const url = `https://mirrortape.net${pathname.replace(/\/$/, "") || "/"}`;
    set("property", "og:url", url);
    set("property", "og:image", "https://mirrortape.net/social-card.png");
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = url;
    if (previousPath.current !== pathname) {
      const main = document.getElementById("main");
      main?.setAttribute("tabindex", "-1");
      main?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
    if (!hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}
