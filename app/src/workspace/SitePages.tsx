import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ArrowRight, ArrowUpRight, BookOpen, ShieldCheck } from "lucide-react";
import { documents, type Section } from "../content/documents";
import { posts, readingMinutes } from "../content/posts";
import { Shell, Recovery } from "./Primitives";
function Sections({ sections }: { sections: Section[] }) {
  return (
    <div className="reading-body">
      {sections.map((section, index) => (
        <section key={section.title} id={`section-${index + 1}`}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
          {section.items && (
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.links && (
            <div className="reading-links">
              {section.links.map((link) =>
                link.href.startsWith("/") ? (
                  <Link key={link.href} to={link.href}>
                    {link.label} <ArrowRight size={15} />
                  </Link>
                ) : (
                  <a key={link.href} href={link.href} rel="noreferrer">
                    {link.label} <ArrowUpRight size={15} />
                  </a>
                ),
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
export function DocumentPage() {
  const { pathname } = useLocation();
  const doc = documents[pathname.replace(/\/$/, "")];
  if (!doc) return <NotFoundPage />;
  return (
    <Shell>
      <div className="content-width editorial-page">
        <header className="editorial-heading">
          <p className="eyebrow">{doc.eyebrow}</p>
          <h1>{doc.title}</h1>
          <p className="hero-description">{doc.description}</p>
          <p className="document-byline">
            625 Technologies Inc. · Updated September 7, 2026
          </p>
        </header>
        <div className="reading-layout">
          <aside className="contents-nav">
            <nav aria-label="On this page">
              <p className="eyebrow">ON THIS PAGE</p>
              {doc.sections.map((s, i) => (
                <a key={s.title} href={`#section-${i + 1}`}>
                  {s.title}
                </a>
              ))}
            </nav>
            <Link className="text-button" to="/contact">
              Questions? Contact us
            </Link>
          </aside>
          <Sections sections={doc.sections} />
        </div>
      </div>
    </Shell>
  );
}
export function BlogPage() {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All articles");
  const categories = ["All articles", ...new Set(posts.map((p) => p.category))];
  const matches = posts.filter(
    (p) =>
      (category === "All articles" || p.category === category) &&
      `${p.title} ${p.description} ${p.sections.flatMap((s) => s.paragraphs).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <Shell>
      <section className="content-width editorial-page">
        <header className="journal-heading">
          <div>
            <p className="eyebrow">THE MIRRORTAPE JOURNAL</p>
            <h1>
              Make room for
              <br />
              <span>clearer thinking.</span>
            </h1>
            <p className="hero-description">
              Product guides and practical habits for a workspace you want to
              return to.
            </p>
          </div>
          <div className="journal-mark" aria-hidden="true">
            <BookOpen size={72} />
            <span>
              NOTES FOR A MORE
              <br />
              CONSIDERED PROCESS
            </span>
          </div>
        </header>
        <div className="journal-tools">
          <div className="field">
            <label htmlFor="article-search">Search the journal</label>
            <input
              id="article-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="field">
            <label htmlFor="article-category">Browse by topic</label>
            <select
              id="article-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <a className="text-button" href="/feed.xml">
            Subscribe by RSS
          </a>
        </div>
        <p className="muted small" role="status">
          {matches.length} {matches.length === 1 ? "article" : "articles"}
        </p>
        <div className="journal-grid">
          {matches.map((post, i) => (
            <article key={post.slug} className="journal-card panel">
              <div className="journal-card-art" aria-hidden="true">
                <span>0{i + 1}</span>
                <BookOpen size={34} />
              </div>
              <p className="eyebrow">
                {post.category} · {readingMinutes(post)} MIN READ
              </p>
              <h2>
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="muted">{post.description}</p>
              <div className="journal-card-footer">
                <time dateTime={post.date}>September 7, 2026</time>
                <Link
                  to={`/blog/${post.slug}`}
                  aria-label={`Read ${post.title}`}
                >
                  Read article <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
        {!matches.length && (
          <div className="panel">
            <h2>No matching articles.</h2>
            <p>Try another phrase or browse all topics.</p>
            <button
              className="secondary-button"
              onClick={() => {
                setQuery("");
                setCategory("All articles");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        <p className="editorial-note">
          Published by 625 Technologies Inc. Product education, not personalized
          investment advice.
        </p>
      </section>
    </Shell>
  );
}
export function BlogArticle() {
  const { pathname } = useLocation();
  const post = posts.find(
    (p) => `/blog/${p.slug}` === pathname.replace(/\/$/, ""),
  );
  if (!post) return <NotFoundPage />;
  return (
    <Shell>
      <article className="content-width editorial-page">
        <header className="editorial-heading">
          <Link className="text-button" to="/blog">
            ← Back to the journal
          </Link>
          <p className="eyebrow">{post.category}</p>
          <h1>{post.title}</h1>
          <p className="hero-description">{post.description}</p>
          <p className="document-byline">
            MirrorTape product notes · 625 Technologies Inc. ·{" "}
            <time dateTime={post.date}>September 7, 2026</time> ·{" "}
            {readingMinutes(post)} min read
          </p>
        </header>
        <div className="reading-layout">
          <aside className="contents-nav">
            <nav aria-label="Article contents">
              <p className="eyebrow">IN THIS ARTICLE</p>
              {post.sections.map((s, i) => (
                <a href={`#section-${i + 1}`} key={s.title}>
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>
          <div>
            <Sections sections={post.sections} />
            <aside className="editorial-note">
              This article explains product use and organizational habits. It is
              not a recommendation to trade or a promise of investment results.
            </aside>
            <section className="related-reading">
              <h2>Keep reading</h2>
              {posts
                .filter((p) => p.slug !== post.slug)
                .slice(0, 2)
                .map((p) => (
                  <Link key={p.slug} to={`/blog/${p.slug}`}>
                    {p.title}
                    <ArrowRight size={18} />
                  </Link>
                ))}
            </section>
          </div>
        </div>
      </article>
    </Shell>
  );
}
export function StatusPage() {
  const [data, setData] = useState<{
      checkedAt: string;
      workspace: boolean;
      email: boolean;
      billing: boolean;
      alpaca: boolean;
      social: Record<string, boolean>;
    } | null>(null),
    [error, setError] = useState(""),
    [checking, setChecking] = useState(true),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    void fetch("/api/public/status", {
      signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            "The service check could not complete. Refresh the check or try again shortly.",
          );
        return r.json();
      })
      .then(setData)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setChecking(false);
      });
    return () => abort.abort();
  }, [attempt]);
  return (
    <Shell>
      <section className="content-width editorial-page">
        <header className="editorial-heading">
          <p className="eyebrow">SERVICE STATUS</p>
          <h1>
            A current check.
            <br />A clear answer.
          </h1>
          <p className="hero-description">
            A snapshot of this installation, checked when you open or refresh
            this page.
          </p>
        </header>
        {checking ? (
          <div className="panel" role="status">
            Checking the workspace and available features…
          </div>
        ) : error ? (
          <Recovery
            message={error}
            label="Retry service check"
            onRetry={() => {
              setError("");
              setChecking(true);
              setAttempt((n) => n + 1);
            }}
          />
        ) : (
          data && (
            <>
              <div className="status-summary panel">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <h2>
                    {data.workspace
                      ? "Workspace is responding"
                      : "Workspace needs attention"}
                  </h2>
                  <p>
                    Checked{" "}
                    <time dateTime={data.checkedAt}>
                      {new Date(data.checkedAt).toLocaleString()}
                    </time>
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setChecking(true);
                    setAttempt((n) => n + 1);
                  }}
                >
                  Refresh status
                </button>
              </div>
              <div className="status-list">
                {[
                  ["Workspace and saved data", data.workspace],
                  ["Verification and recovery email", data.email],
                  ["Paid memberships", data.billing],
                  ["Alpaca account viewing", data.alpaca],
                  ...Object.entries(data.social).map(([name, value]) => [
                    `${name[0].toUpperCase() + name.slice(1)} sign-in`,
                    value,
                  ]),
                ].map(([name, enabled]) => (
                  <div key={String(name)}>
                    <strong>{name}</strong>
                    <span
                      className={
                        enabled ? "status-available" : "status-unavailable"
                      }
                    >
                      {enabled ? "Available" : "Not available"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )
        )}
        <div className="reading-body">
          <section>
            <h2>What this check means</h2>
            <p>
              Workspace availability reflects the application and database
              check. Integration availability means the feature is enabled here;
              it does not verify a third-party provider's uptime or your
              individual account permissions. This page does not report
              historical uptime or an independent external monitor.
            </p>
            <p>
              If this site is completely unreachable, this page may be
              unreachable too. Use your broker directly for time-sensitive
              account actions.
            </p>
            <Link to="/contact?topic=Account">Report an issue</Link>
          </section>
        </div>
      </section>
    </Shell>
  );
}
export function NotFoundPage() {
  return (
    <Shell>
      <section className="content-width editorial-page">
        <p className="eyebrow">404 · PAGE NOT FOUND</p>
        <h1>This page is off the tape.</h1>
        <p className="hero-description">
          The link may be outdated or the address may be incorrect. Your saved
          account data is separate from this page.
        </p>
        <div className="button-row">
          <Link className="primary-button" to="/">
            Return home
          </Link>
          <Link className="secondary-button" to="/blog">
            Browse the journal
          </Link>
          <Link className="text-button" to="/contact">
            Report a broken link
          </Link>
        </div>
      </section>
    </Shell>
  );
}
