import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useInView';

const LABEL = '[ THE PROTOCOL ]';
const TITLE = 'From their fill to your account in ~38 milliseconds.';
const SUB =
  'MirrorTape is a signal-relay layer between verified traders and your brokerage. You keep custody, you set the limits, we enforce them on every order.';

/** Types the bracketed section label character by character. */
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

/** Section 1 — page header: typed label, word-reveal H1, cyan hairline draw. */
export default function PageHeader() {
  const reduced = usePrefersReducedMotion();
  const typed = useTypewriter(LABEL, !reduced);
  const [lineOn, setLineOn] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setLineOn(true), 400);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const lineShown = reduced || lineOn;

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-16 pt-20 text-center">
      <div className="min-h-[18px] font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
        {typed}
      </div>
      <h1 className="mx-auto mt-4 max-w-[920px] font-sans text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] text-text-1 max-md:text-4xl">
        {TITLE.split(' ').map((w, i) => (
          <span
            key={i}
            className="reveal inline-block"
            style={
              {
                ['--reveal-delay' as string]: `${0.15 + i * 0.09}s`,
                ['--reveal-y' as string]: '28px',
              }
            }
          >
            {w}&nbsp;
          </span>
        ))}
      </h1>
      <div
        className="mx-auto mt-6 h-px w-[200px] origin-center bg-cyan"
        style={{
          transform: lineShown ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
        aria-hidden="true"
      />
      <p
        className="reveal mx-auto mt-6 max-w-[680px] font-sans text-base leading-[1.65] text-text-2"
        style={{ ['--reveal-delay' as string]: '0.55s', ['--reveal-y' as string]: '16px' }}
      >
        {SUB}
      </p>
    </section>
  );
}
