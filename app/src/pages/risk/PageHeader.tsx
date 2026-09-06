import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useInView';

const LABEL = '[ RISK ENGINE ]';
const TITLE = 'Copy trading without a kill switch is gambling.';
const SUB =
  'Every mirrored order passes through limits you define before your broker ever sees it. Here\u2019s exactly how that works — and how your account is protected.';

function useTypewriter(text: string, enabled: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const t = window.setInterval(() => {
      setN((v) => {
        if (v >= text.length) window.clearInterval(t);
        return Math.min(text.length, v + 1);
      });
    }, 32);
    return () => window.clearInterval(t);
  }, [text, enabled]);
  return enabled ? text.slice(0, n) : text;
}

/** Section 1 — page header: typed label, word-reveal H1, red→mint hairline draw. */
export default function PageHeader() {
  const reduced = usePrefersReducedMotion();
  const typed = useTypewriter(LABEL, !reduced);
  const [lineOn, setLineOn] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setLineOn(true), 350);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const lineShown = reduced || lineOn;

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-16 pt-20">
      <div className="min-h-[18px] font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
        {typed}
      </div>
      <h1 className="mt-4 max-w-[860px] font-sans text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] text-text-1 max-md:text-4xl">
        {TITLE.split(' ').map((w, i) => (
          <span
            key={i}
            className="reveal inline-block"
            style={{ ['--reveal-delay' as string]: `${0.15 + i * 0.09}s`, ['--reveal-y' as string]: '28px' }}
          >
            {w}&nbsp;
          </span>
        ))}
      </h1>
      <div
        className="mt-6 h-px w-[240px] origin-left"
        style={{
          background: 'linear-gradient(to right, var(--red), var(--mint))',
          transform: lineShown ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
        aria-hidden="true"
      />
      <p
        className="reveal mt-6 max-w-[680px] font-sans text-base leading-[1.65] text-text-2"
        style={{ ['--reveal-delay' as string]: '0.55s', ['--reveal-y' as string]: '16px' }}
      >
        {SUB}
      </p>
    </section>
  );
}
