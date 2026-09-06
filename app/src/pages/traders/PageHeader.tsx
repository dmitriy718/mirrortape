import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const LABEL = '[ VERIFIED TRADERS ]';
const TITLE = '1,208 traders. Every stat audited.';

/** Label types in character-by-character (18ms stagger); final state instantly under reduced motion. */
function TypeLabel() {
  const reduced = usePrefersReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduced) return; // final state rendered directly below
    const t = setInterval(() => {
      setCount((c) => {
        if (c >= LABEL.length) {
          clearInterval(t);
          return c;
        }
        return c + 1;
      });
    }, 18);
    return () => clearInterval(t);
  }, [reduced]);

  const text = reduced ? LABEL : LABEL.slice(0, count);

  return (
    <div
      className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan"
      aria-label={LABEL}
    >
      <span aria-hidden="true">{text}</span>
      <span
        aria-hidden="true"
        className={cn('cursor-blink ml-0.5 inline-block h-[11px] w-[6px] bg-cyan align-middle', count >= LABEL.length && 'opacity-0')}
      />
    </div>
  );
}

/** Count-up stat for the header strip (1s, eased, staggered via delay). */
function HeaderStat({
  value,
  format,
  label,
  mint = false,
  delay = 0,
}: {
  value: number;
  format: (v: number) => string;
  label: string;
  mint?: boolean;
  delay?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (reduced) return; // final state rendered directly below
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / 1000);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(value * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    const timeout = setTimeout(() => {
      raf.current = requestAnimationFrame(step);
    }, delay * 1000);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf.current);
    };
  }, [value, delay, reduced]);

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={cn(
          'font-mono text-[24px] font-bold leading-none tabular-nums md:text-[28px]',
          mint ? 'text-mint' : 'text-text-1',
        )}
      >
        {format(reduced ? value : display)}
      </span>
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-text-3">
        {label}
      </span>
    </div>
  );
}

/** Section 1 — page header: typing label, word-reveal H1, sub copy, 3 inline stats. */
export default function PageHeader() {
  const reduced = usePrefersReducedMotion();
  const words = TITLE.split(' ');

  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-20 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-10">
        <div className="max-w-[640px]">
          <TypeLabel />
          <h1 className="font-sans text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-text-1 md:text-[48px]">
            {words.map((w, i) => (
              <motion.span
                key={`${w}-${i}`}
                className="inline-block will-change-transform"
                initial={reduced ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: reduced ? 0 : 0.5 + i * 0.09,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {w}
                {i < words.length - 1 ? ' ' : ''}
              </motion.span>
            ))}
          </h1>
          <p className="mt-5 max-w-[640px] font-sans text-base leading-[1.65] text-text-2">
            Leaderboard performance is computed from verified brokerage fills — not screenshots.
            Mirror any trader in one click, with your own caps enforced.
          </p>
        </div>

        <div className="flex gap-10 border-l border-border pl-10 max-md:border-l-0 max-md:pl-0">
          <HeaderStat
            value={64.2}
            format={(v) => `+${v.toFixed(1)}%`}
            label="Median top-50 12M return"
            mint
            delay={0.9}
          />
          <HeaderStat value={200} format={(v) => `${Math.round(v)}+`} label="Min. verified trades" delay={1.05} />
          <HeaderStat value={12} format={(v) => `${Math.round(v)}mo`} label="Min. track record" delay={1.2} />
        </div>
      </div>
    </section>
  );
}
