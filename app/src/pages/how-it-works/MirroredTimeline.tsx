import { useRef } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SectionHeader from '@/components/SectionHeader';
import { usePrefersReducedMotion } from '@/hooks/useInView';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MONO = 'font-mono font-semibold text-text-1';

const EVENTS: Array<{ time: string; body: ReactNode }> = [
  {
    time: '14:31:52.004',
    body: (
      <>
        <span className="font-mono font-semibold text-cyan">@gamma_flow</span> sells{' '}
        <span className={MONO}>10 NVDA 250221C150</span> contracts at{' '}
        <span className={MONO}>$8.35</span> (verified fill).
      </>
    ),
  },
  {
    time: '14:31:52.006',
    body: (
      <>
        Signal captured; fan-out to <span className={MONO}>7,556</span> mirroring accounts begins.
      </>
    ),
  },
  {
    time: '14:31:52.011',
    body: (
      <>
        Risk engine evaluates your caps: allocation <span className="font-mono text-mint">✓</span>,
        contracts cap <span className={MONO}>5/10</span>{' '}
        <span className="font-mono text-mint">✓</span>, sector{' '}
        <span className="font-mono text-mint">✓</span>.
      </>
    ),
  },
  {
    time: '14:31:52.039',
    body: (
      <>
        Your order routed: <span className={MONO}>SELL 5 NVDA 250221C150 @ MKT</span> (size scaled
        to your 12% allocation).
      </>
    ),
  },
  {
    time: '14:31:52.112',
    body: (
      <>
        Broker confirms fill @ <span className={MONO}>$8.31</span>.
      </>
    ),
  },
  {
    time: '14:31:52.118',
    body: (
      <>
        Position appears in your MirrorTape terminal; total elapsed{' '}
        <span className="font-mono font-bold text-mint">116ms</span> (slower tail example).
      </>
    ),
  },
];

/**
 * Section 6 — mirrored options trade timeline. Spine draws top→bottom tied to
 * scroll (ScrollTrigger scrub, no pin). Nodes activate as the spine passes.
 * Reduced motion: fully-lit static timeline.
 */
export default function MirroredTimeline() {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const tallyRef = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      if (reduced || !wrapRef.current) return;
      const tallyEl = tallyRef.current;
      const tally = { v: 0 };
      const renderTally = () => {
        if (tallyEl) tallyEl.textContent = `${Math.round(tally.v)}ms`;
      };
      tally.v = 0;
      renderTally();

      const n = EVENTS.length;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top 78%',
          end: 'bottom 55%',
          scrub: 0.4,
        },
      });

      tl.fromTo(
        '.js-spine',
        { scaleY: 0 },
        { scaleY: 1, duration: n, ease: 'none', transformOrigin: 'top' },
        0,
      );
      EVENTS.forEach((_, i) => {
        const at = i + 0.12;
        tl.fromTo(
          `.js-dot-${i}`,
          { backgroundColor: '#16213a', boxShadow: '0 0 0 rgba(34,211,238,0)' },
          {
            backgroundColor: '#22d3ee',
            boxShadow: '0 0 12px rgba(34,211,238,0.45)',
            duration: 0.15,
          },
          at,
        )
          .fromTo(`.js-time-${i}`, { color: '#6b7280' }, { color: '#ffffff', duration: 0.15 }, at)
          .fromTo(`.js-text-${i}`, { color: '#6b7280' }, { color: '#e5e7eb', duration: 0.15 }, at);
      });
      tl.fromTo('.js-tally', { opacity: 0 }, { opacity: 1, duration: 0.2 }, n + 0.1).to(
        tally,
        { v: 116, duration: 0.6, ease: 'none', onUpdate: renderTally },
        n + 0.1,
      );
    },
    { scope: wrapRef, dependencies: [reduced] },
  );

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <SectionHeader label="OPTIONS EXAMPLE" title="Mirrored trade timeline." />
      <div ref={wrapRef} className="relative mx-auto max-w-[980px]">
        {/* spine */}
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" aria-hidden="true">
          <div className="js-spine h-full w-full bg-cyan" />
        </div>
        <ol className="space-y-12">
          {EVENTS.map((e, i) => (
            <li key={e.time} className="relative pl-10">
              <span
                className={`js-dot-${i} absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-2 border-bg`}
                style={{ backgroundColor: 'var(--cyan)', boxShadow: '0 0 12px rgba(34,211,238,0.45)' }}
                aria-hidden="true"
              />
              <div
                className={`js-time-${i} font-mono text-[11px] font-semibold tabular-nums tracking-[0.08em] text-text-1`}
              >
                {e.time}
              </div>
              <p
                className={`js-text-${i} mt-1 max-w-[640px] font-sans text-[15px] leading-[1.65] text-text-1`}
              >
                {e.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="js-tally mt-12 flex items-center gap-3 pl-10">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3">
            Total elapsed
          </span>
          <span
            ref={tallyRef}
            className="font-mono text-2xl font-bold tabular-nums text-mint"
          >
            116ms
          </span>
        </div>
      </div>
    </section>
  );
}
