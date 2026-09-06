import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CATEGORIES, type FaqEntry } from '@/pages/faq/data';
import { EASE_OUT_EXPO, TypedText } from '@/pages/pricing/reveal';
import { cn } from '@/lib/utils';

/** Wrap matching terms in a cyan-dim highlight. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: Array<{ str: string; match: boolean }> = [];
  let i = 0;
  while (i < text.length) {
    const hit = lower.indexOf(q, i);
    if (hit === -1) {
      parts.push({ str: text.slice(i), match: false });
      break;
    }
    if (hit > i) parts.push({ str: text.slice(i, hit), match: false });
    parts.push({ str: text.slice(hit, hit + q.length), match: true });
    i = hit + q.length;
  }
  return (
    <>
      {parts.map((p, idx) =>
        p.match ? (
          <mark key={idx} className="rounded-sm bg-cyan-dim px-0.5 text-cyan">
            {p.str}
          </mark>
        ) : (
          <span key={idx}>{p.str}</span>
        ),
      )}
    </>
  );
}

function FaqRow({
  item,
  query,
  forceOpen,
  index,
  searching,
}: {
  item: FaqEntry;
  query: string;
  forceOpen: boolean;
  index: number;
  searching: boolean;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const isOpen = searching ? forceOpen : open;
  return (
    <motion.div
      layout={searching ? 'position' : false}
      initial={{ opacity: 0, y: reduced ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: reduced ? 0.01 : 0.4,
        ease: EASE_OUT_EXPO,
        delay: searching ? 0 : index * 0.05,
        layout: { duration: reduced ? 0.01 : 0.2 },
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-mono text-sm font-semibold text-text-1">
          <Highlight text={item.q} query={query} />
        </span>
        <span
          className={cn(
            'shrink-0 font-mono text-lg leading-none text-cyan transition-transform duration-300 ease-out-expo',
            isOpen && 'rotate-45',
          )}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] ease-out-expo"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', transitionDuration: '420ms' }}
      >
        <div className="overflow-hidden">
          <p
            className={cn(
              'pb-4 pr-8 font-sans text-[15px] leading-relaxed text-text-2 transition-opacity duration-300',
              isOpen ? 'opacity-100 delay-200' : 'opacity-0',
            )}
          >
            <Highlight text={item.a} query={query} />
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/** Section 2 — category accordion groups, live-filtered by the search query. */
export default function FaqGroups({ query }: { query: string }) {
  const reduced = useReducedMotion();
  const searching = query.length > 0;

  const groups = useMemo(() => {
    if (!searching) return CATEGORIES.map((c) => ({ ...c, matches: c.items }));
    const q = query.toLowerCase();
    return CATEGORIES.map((c) => ({
      ...c,
      matches: c.items.filter(
        (it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q),
      ),
    })).filter((c) => c.matches.length > 0);
  }, [query, searching]);

  const total = groups.reduce((n, g) => n + g.matches.length, 0);

  if (searching && total === 0) {
    return (
      <section className="mx-auto max-w-[840px] px-6 pt-16">
        <div className="rounded-md border border-border bg-surface-1 px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
          NO RESULTS — try &ldquo;options&rdquo; or &ldquo;billing&rdquo;
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[840px] px-6 pt-16">
      {groups.map((cat, ci) => (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: reduced ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: reduced ? 0.01 : 0.5,
            ease: EASE_OUT_EXPO,
            delay: searching ? 0 : ci * 0.12,
          }}
          className={cn(ci > 0 && 'mt-12')}
        >
          <div className="border-b border-border pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
            <TypedText text={`[ ${cat.label} ]`} />
            {searching && (
              <span className="ml-2 text-text-3">
                {cat.matches.length}/{cat.items.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-border border-b border-border">
            {cat.matches.map((item, i) => (
              <FaqRow
                key={item.q}
                item={item}
                query={query}
                forceOpen={searching}
                index={i}
                searching={searching}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </section>
  );
}
