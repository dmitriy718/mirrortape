import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Shield, ArrowRight, Check } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';
import Sparkline from '@/components/Sparkline';
import LiveDot from '@/components/LiveDot';
import { usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STEPS = [
  {
    num: '01',
    label: 'CONNECT',
    body: 'Link your brokerage in read/trade-only mode. We never custody funds. Alpaca, Interactive Brokers, Schwab, Webull, E*TRADE.',
  },
  {
    num: '02',
    label: 'CHOOSE',
    body: 'Pick verified traders by 12M return, win rate, and max drawdown. Every stat is audited from real fills.',
  },
  {
    num: '03',
    label: 'MIRROR',
    body: 'Set allocation and caps. Every signal executes in your account in ~38ms with your limits enforced.',
  },
];

const BROKERS = ['Alpaca', 'Interactive Brokers', 'Schwab', 'Webull', 'E*TRADE'];

const MINI_LEADERS = [
  { handle: '@delta_hunter', ret: '+214.6%', spark: [4, 5, 4.4, 6, 7, 6.5, 8, 9.5, 9, 11] },
  { handle: '@iron_condor_kate', ret: '+162.3%', spark: [5, 5.5, 6, 6.2, 7, 7.4, 7.2, 8, 8.6, 9] },
  { handle: '@tape_reader', ret: '+141.8%', spark: [6, 5, 6.5, 6, 7, 6.6, 7.8, 7.4, 8.4, 8.9] },
];

function ConnectVisual() {
  const [connected, setConnected] = useState(false);
  return (
    <div className="flex h-full flex-col justify-center gap-5 p-6">
      <div className="grid grid-cols-2 gap-2">
        {BROKERS.map((b, i) => (
          <button
            key={b}
            type="button"
            onClick={() => setConnected(true)}
            className={cn(
              'reveal cursor-pointer rounded border px-3 py-2.5 text-left font-mono text-xs font-semibold transition-colors duration-150',
              connected && i === 1
                ? 'border-cyan bg-cyan-dim text-cyan'
                : 'border-border bg-surface-2 text-text-2 hover:border-cyan hover:text-cyan',
            )}
            style={{ ['--reveal-delay' as string]: `${i * 0.06}s`, ['--reveal-y' as string]: '10px' }}
          >
            {b}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <svg width="64" height="2" className="shrink-0" aria-hidden="true">
          <line x1="0" y1="1" x2="64" y2="1" stroke="var(--cyan)" strokeWidth="1.5" strokeDasharray="64" strokeDashoffset={connected ? 0 : 64} style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
        </svg>
        <Shield size={18} style={{ color: connected ? 'var(--mint)' : 'var(--text-3)' }} />
        <span
          className={cn(
            'font-mono text-[11px] font-bold uppercase tracking-[0.14em]',
            connected ? 'text-mint' : 'text-text-3',
          )}
        >
          {connected ? 'CONNECTED ✓' : 'AWAITING LINK'}
        </span>
      </div>
    </div>
  );
}

function ChooseVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-1 p-6">
      {MINI_LEADERS.map((t, i) => (
        <div
          key={t.handle}
          className="reveal flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0"
          style={{ ['--reveal-delay' as string]: `${i * 0.08}s`, ['--reveal-y' as string]: '12px' }}
        >
          <span className="font-mono text-[13px] font-semibold text-text-1">{t.handle}</span>
          <Sparkline data={t.spark} width={72} height={22} />
          <span className="font-mono text-[13px] font-bold tabular-nums text-mint">{t.ret}</span>
        </div>
      ))}
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
        Stats audited from real brokerage fills
      </p>
    </div>
  );
}

function MirrorVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6">
      <div className="rounded border border-border bg-surface-2 p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">Signal</div>
        <div className="mt-1 font-mono text-[13px] text-text-1">@delta_hunter BOUGHT 50 AAPL @ 238.42</div>
      </div>
      <div className="flex items-center gap-2 text-cyan">
        <ArrowRight size={16} />
        <span className="rounded bg-cyan-dim px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-cyan">
          38ms
        </span>
      </div>
      <div className="relative rounded border border-mint/50 bg-[rgba(52,211,153,0.06)] p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">Your account</div>
        <div className="mt-1 font-mono text-[13px] text-text-1">BOUGHT 12 AAPL @ 238.44</div>
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded border border-mint px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mint">
          <Check size={10} /> Filled
        </span>
      </div>
    </div>
  );
}

const VISUALS = [ConnectVisual, ChooseVisual, MirrorVisual];

/** Section 4 — GSAP pinned three-step sequence. Reduced motion: static grid. */
export default function HowItWorks() {
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      if (reduced || !stageRef.current) return;
      ScrollTrigger.create({
        trigger: stageRef.current,
        start: 'top 15%',
        end: '+=220%',
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const step = Math.min(2, Math.floor(self.progress * 3));
          setActive(step);
          if (progressRef.current) {
            progressRef.current.style.transform = `scaleY(${self.progress})`;
          }
        },
      });
    },
    { dependencies: [reduced] },
  );

  return (
    <section ref={sectionRef} className="mx-auto max-w-[1280px] px-6 py-24">
      <SectionHeader label="PROTOCOL" title="Three steps between you and the pros." center />

      {reduced ? (
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.num} className="rounded-[10px] border border-border bg-surface-1 p-6">
              <div className="font-mono text-2xl font-bold text-cyan">{s.num}</div>
              <div className="mt-2 font-mono text-sm font-bold uppercase tracking-[0.14em] text-text-1">
                {s.label}
              </div>
              <p className="mt-3 font-sans text-sm leading-relaxed text-text-2">{s.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <div ref={stageRef} className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          {/* step rail */}
          <div className="relative pl-6">
            <div className="absolute inset-y-2 left-0 w-px bg-border" aria-hidden="true">
              <div
                ref={progressRef}
                className="h-full w-full origin-top bg-cyan"
                style={{ transform: 'scaleY(0)' }}
              />
            </div>
            <div className="flex flex-col gap-10">
              {STEPS.map((s, i) => {
                const isActive = i === active;
                return (
                  <div
                    key={s.num}
                    className="transition-opacity duration-300"
                    style={{ opacity: isActive ? 1 : 0.4 }}
                  >
                    <div className="flex items-baseline gap-3">
                      <span
                        className={cn(
                          'font-mono text-2xl font-bold tabular-nums transition-colors duration-300',
                          isActive ? 'text-cyan' : 'text-text-3',
                        )}
                      >
                        {s.num}
                      </span>
                      <span
                        className={cn(
                          'font-mono text-sm font-bold uppercase tracking-[0.14em] transition-colors duration-300',
                          isActive ? 'text-text-1' : 'text-text-3',
                        )}
                      >
                        {s.label}
                      </span>
                      {isActive && <LiveDot variant="cyan" />}
                    </div>
                    <p className="mt-2 max-w-[420px] font-sans text-[15px] leading-relaxed text-text-2">
                      {s.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* morphing panel */}
          <div className="relative h-[380px] overflow-hidden rounded-[10px] border border-border bg-surface-1">
            {VISUALS.map((V, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-[opacity,transform] ease-out-expo"
                style={{
                  transitionDuration: '450ms',
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? 'translateY(0)' : 'translateY(16px)',
                  pointerEvents: i === active ? 'auto' : 'none',
                }}
              >
                <V />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
