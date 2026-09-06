import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Radio, ShieldCheck, Landmark } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function useMedia(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setMatches(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return matches;
}

const CHECKS = ['allocation cap ✓', 'per-trade cap ✓', 'sector limit ✓'];

function CandleGlyph() {
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">
      <line x1="5" y1="2" x2="5" y2="18" stroke="var(--mint)" strokeWidth="1" />
      <rect x="3" y="5" width="4" height="8" fill="var(--mint)" />
      <line x1="15" y1="4" x2="15" y2="19" stroke="var(--red)" strokeWidth="1" />
      <rect x="13" y="8" width="4" height="7" fill="var(--red)" />
      <line x1="25" y1="1" x2="25" y2="14" stroke="var(--mint)" strokeWidth="1" />
      <rect x="23" y="4" width="4" height="6" fill="var(--mint)" />
    </svg>
  );
}

function NodeGlyph({ index }: { index: number }) {
  if (index === 0)
    return (
      <div className="flex flex-col items-center gap-1.5">
        <img
          src="/avatar-02.png"
          alt=""
          className="h-7 w-7 rounded-full border border-border object-cover"
        />
        <CandleGlyph />
      </div>
    );
  if (index === 1) return <Radio size={30} strokeWidth={1.5} className="text-cyan" />;
  if (index === 2)
    return (
      <div className="flex flex-col items-center gap-1">
        <ShieldCheck size={28} strokeWidth={1.5} className="text-cyan" />
        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-text-3">
          caps · sector · level
        </span>
      </div>
    );
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Landmark size={28} strokeWidth={1.5} className="text-mint" />
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-mint">
        FILLED ✓
      </span>
    </div>
  );
}

const NODE_LABELS = ['TRADER EXECUTES', 'SIGNAL CAPTURED', 'RISK ENGINE', 'YOUR BROKER FILLS'];

function NodeStamps({ index }: { index: number }) {
  if (index === 0)
    return (
      <span className="js-stamp-0 rounded border border-cyan/50 bg-cyan-dim px-2 py-1 font-mono text-[10px] font-bold tabular-nums text-cyan">
        BOT 100 NVDA @131.27
      </span>
    );
  if (index === 1)
    return (
      <span className="js-stamp-1 rounded border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] font-bold tabular-nums text-text-1">
        SIGNAL · 2ms
      </span>
    );
  if (index === 2)
    return (
      <>
        {CHECKS.map((c, i) => (
          <span
            key={c}
            className={`js-check-${i} font-mono text-[10px] tabular-nums text-mint`}
          >
            {c}
          </span>
        ))}
        <span className="js-stamp-2 mt-1 rounded border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] font-bold tabular-nums text-text-1">
          CHECKS · 31ms
        </span>
      </>
    );
  return (
    <span className="js-stamp-3 rounded border border-mint/60 bg-[rgba(52,211,153,0.08)] px-2 py-1 font-mono text-[10px] font-bold tabular-nums text-mint">
      FILLED @131.31 · +4ms latency
    </span>
  );
}

function NodeCard({
  index,
  staticMode = false,
  className,
}: {
  index: number;
  staticMode?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative flex h-24 w-24 items-center justify-center rounded-[10px] border border-border bg-surface-1">
        <span
          className={cn(
            `js-glow-${index} pointer-events-none absolute inset-0 rounded-[10px] border border-cyan`,
            staticMode ? 'opacity-100 shadow-cyan-glow' : 'opacity-100',
          )}
          aria-hidden="true"
        />
        <NodeGlyph index={index} />
      </div>
      <div
        className={cn(
          `js-label-${index} mt-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em]`,
          staticMode ? 'text-text-1' : 'text-text-3',
        )}
      >
        <span className="text-cyan">0{index + 1}</span> · {NODE_LABELS[index]}
      </div>
      <div className="mt-2 flex min-h-[84px] flex-col items-center justify-start gap-1">
        <NodeStamps index={index} />
      </div>
    </div>
  );
}

function Connector({ index }: { index: number }) {
  return (
    <svg
      width="72"
      height="96"
      viewBox="0 0 72 96"
      className="mx-1 shrink-0"
      aria-hidden="true"
    >
      <line x1="4" y1="48" x2="68" y2="48" stroke="var(--border)" strokeWidth="1" />
      <circle className={`js-dot-${index}`} cx="4" cy="48" r="3.5" fill="var(--cyan)" />
    </svg>
  );
}

function StageHeading() {
  return (
    <div className="mb-12 text-center">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
        [ THE PIPELINE ]
      </div>
      <h2 className="mt-3 font-sans text-3xl font-bold tracking-[-0.02em] text-text-1 max-md:text-2xl">
        Four hops between their fill and yours.
      </h2>
    </div>
  );
}

/** Static fully-lit fallback (reduced motion / narrow viewports). */
function StaticPipeline() {
  return (
    <div className="relative overflow-hidden py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'url(/grid-texture.png)', backgroundRepeat: 'repeat' }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1280px] px-6">
        <StageHeading />
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {NODE_LABELS.map((_, i) => (
            <NodeCard key={i} index={i} staticMode />
          ))}
        </div>
        <div className="mt-12 text-center">
          <span className="font-mono text-sm font-bold tracking-[0.14em] text-cyan">
            ≈ 38ms END-TO-END
          </span>
        </div>
      </div>
    </div>
  );
}

/** Section 2 — GSAP-pinned 4-node signal pipeline that activates with scroll. */
export default function PipelineDiagram() {
  const reduced = usePrefersReducedMotion();
  const wide = useMedia('(min-width: 1024px)');
  const animated = !reduced && wide;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      if (!animated || !stageRef.current) return;
      const counterEl = counterRef.current;
      const counter = { v: 0 };
      const renderCounter = () => {
        if (counterEl) counterEl.textContent = `≈ ${Math.round(counter.v)}ms END-TO-END`;
      };
      counter.v = 0;
      renderCounter();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
        },
      });

      const stamp = (sel: string, at: number) =>
        tl.fromTo(
          sel,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2.5)' },
          at,
        );
      const light = (i: number, at: number) => {
        tl.fromTo(`.js-glow-${i}`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, at).fromTo(
          `.js-label-${i}`,
          { color: '#6b7280' },
          { color: '#ffffff', duration: 0.3 },
          at,
        );
      };
      const travel = (i: number, at: number) => {
        tl.fromTo(`.js-dot-${i}`, { opacity: 0 }, { opacity: 1, duration: 0.08 }, at).fromTo(
          `.js-dot-${i}`,
          { attr: { cx: 4 } },
          { attr: { cx: 68 }, duration: 0.7, ease: 'none' },
          at,
        );
      };

      // 0–25%: trader executes
      light(0, 0);
      stamp('.js-stamp-0', 0.35);
      // 25–50%: signal captured
      travel(0, 0.9);
      light(1, 1.6);
      stamp('.js-stamp-1', 1.85);
      // 50–75%: risk engine checks
      travel(1, 2.3);
      light(2, 3.0);
      stamp('.js-check-0', 3.2);
      stamp('.js-check-1', 3.45);
      stamp('.js-check-2', 3.7);
      stamp('.js-stamp-2', 3.95);
      // 75–100%: broker fill + total
      travel(2, 4.3);
      light(3, 5.0);
      stamp('.js-stamp-3', 5.25);
      tl.fromTo('.js-counter', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 5.6).to(
        counter,
        { v: 38, duration: 0.7, ease: 'none', onUpdate: renderCounter },
        5.6,
      );
    },
    { scope: stageRef, dependencies: [animated] },
  );

  if (!animated) return <StaticPipeline />;

  return (
    <div ref={stageRef} className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'url(/grid-texture.png)', backgroundRepeat: 'repeat' }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[1280px] flex-col items-center justify-center px-6 py-12">
        <StageHeading />
        <div className="flex items-start justify-center">
          {NODE_LABELS.map((_, i) => (
            <div key={i} className="flex items-start">
              <NodeCard index={i} className="w-[168px] shrink-0" />
              {i < NODE_LABELS.length - 1 && <Connector index={i} />}
            </div>
          ))}
        </div>
        <div className="js-counter mt-10 text-center">
          <span
            ref={counterRef}
            className="font-mono text-sm font-bold tabular-nums tracking-[0.14em] text-cyan"
          >
            ≈ 38ms END-TO-END
          </span>
        </div>
      </div>
    </div>
  );
}
