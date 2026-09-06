import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import Panel from '@/components/Panel';
import { useInView, usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const CHECKLIST = [
  '12+ months connected brokerage history',
  '200+ verified fills',
  'Max drawdown review & disclosure',
  'No pump-pattern or wash-trade flags',
  'Quarterly re-audit',
  'Immediate delisting on data mismatch',
];

/** `~9%` stat that counts up once in view. */
function PassRate() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const reduced = usePrefersReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView || reduced) return;
    const start = performance.now();
    let raf = 0;
    const stepFn = (t: number) => {
      const p = Math.min(1, (t - start) / 1000);
      setV(9 * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(stepFn);
    };
    raf = requestAnimationFrame(stepFn);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced]);
  return (
    <div ref={ref} className="mt-5 flex items-baseline gap-3">
      <span className="font-mono text-2xl font-bold tabular-nums text-cyan">
        ~{reduced ? '9' : v.toFixed(1).replace(/\.0$/, '')}%
      </span>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3">
        of applicants pass verification
      </span>
    </div>
  );
}

/** Section 5 — trader verification standards: copy + checklist panel. */
export default function VerificationStandards() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
            [ WHO YOU CAN COPY ]
          </div>
          <h3 className="font-sans text-2xl font-semibold tracking-[-0.01em] text-text-1">
            Verification is a filter, not a formality.
          </h3>
          <p className="mt-4 max-w-[520px] font-sans text-[15px] leading-[1.65] text-text-2">
            Before a trader appears on the leaderboard, we connect directly to their brokerage and
            reconstruct their real trade history. No screenshots, no self-reported returns. And it
            doesn't stop at admission — accounts are re-audited quarterly, and if live fills ever
            diverge from what we display, the trader is delisted on the spot.
          </p>
        </div>
        <div ref={ref}>
          <Panel label="VERIFICATION CHECKLIST" bodyClassName="p-5">
            {CHECKLIST.map((item, i) => (
              <div
                key={item}
                className={cn(
                  'flex items-center gap-3 border-b border-border/60 py-3 font-mono text-[13px] text-text-1 last:border-0',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-mint/50 bg-[rgba(52,211,153,0.1)] transition-[opacity,transform] duration-300',
                    inView ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                  )}
                  style={{
                    transitionDelay: `${i * 0.09}s`,
                    transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  <Check size={11} className="text-mint" strokeWidth={3} />
                </span>
                <span
                  className={cn(
                    'transition-[opacity,transform] duration-300 ease-out-expo',
                    inView ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0',
                  )}
                  style={{ transitionDelay: `${i * 0.09 + 0.05}s` }}
                >
                  {item}
                </span>
              </div>
            ))}
          </Panel>
          <PassRate />
        </div>
      </div>
    </section>
  );
}
