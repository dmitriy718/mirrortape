import { useState } from 'react';
import { Check, Lock, X } from 'lucide-react';
import Panel from '@/components/Panel';
import Sparkline from '@/components/Sparkline';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

/* ---------- Phase 01 visual: API scope checklist with working toggles ---------- */

function ScopeToggle({
  label,
  locked = false,
  defaultOn = true,
}: {
  label: string;
  locked?: boolean;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  const effective = locked ? false : on;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
      <span className="flex items-center gap-2 font-mono text-[13px] text-text-1">
        {effective ? (
          <Check size={13} className="shrink-0 text-mint" />
        ) : (
          <X size={13} className="shrink-0 text-red" />
        )}
        {label}
        {locked && <Lock size={11} className="text-text-3" aria-label="Locked off" />}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={effective}
        aria-label={`${label} scope`}
        disabled={locked}
        onClick={() => setOn((v) => !v)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200',
          effective ? 'border-mint/60 bg-[rgba(52,211,153,0.15)]' : 'border-border bg-surface-3',
          locked ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-[left,background-color] duration-200 ease-out-expo',
            effective ? 'left-[19px] bg-mint' : 'left-[3px]',
            locked ? 'bg-red' : !effective && 'bg-text-3',
          )}
        />
      </button>
    </div>
  );
}

function ConnectVisual() {
  return (
    <Panel label="CONNECTION SCOPES" bodyClassName="p-5">
      <ScopeToggle label="read positions" />
      <ScopeToggle label="place orders" />
      <ScopeToggle label="withdraw funds" locked />
      <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.04em] text-text-3">
        Withdrawal scope is refused at the API layer — cryptographically impossible, not just
        policy. Revoke anytime from your broker.
      </p>
    </Panel>
  );
}

/* ---------- Phase 02 visual: cropped leaderboard rows ---------- */

const TRADERS = [
  {
    handle: '@delta_hunter',
    style: 'OPTIONS MOMENTUM',
    ret: '+214.6%',
    win: '61.2%',
    dd: '-18.7%',
    spark: [4, 5, 4.4, 6, 7, 6.5, 8, 9.5, 9, 11],
  },
  {
    handle: '@iron_condor_kate',
    style: 'PREMIUM SELLING',
    ret: '+162.3%',
    win: '74.1%',
    dd: '-9.8%',
    spark: [5, 5.5, 6, 6.2, 7, 7.4, 7.2, 8, 8.6, 9],
  },
  {
    handle: '@tape_reader',
    style: 'LARGE-CAP EQUITIES',
    ret: '+141.8%',
    win: '58.9%',
    dd: '-14.2%',
    spark: [6, 5, 6.5, 6, 7, 6.6, 7.8, 7.4, 8.4, 8.9],
  },
];

function ChooseVisual() {
  return (
    <Panel label="LEADERBOARD · AUDITED FILLS" bodyClassName="p-5">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 border-b border-border pb-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-text-3">
        <span>Trader · 12M curve</span>
        <span className="text-right">12M RET</span>
        <span className="text-right">WIN</span>
        <span className="text-right">MAX DD</span>
      </div>
      {TRADERS.map((t) => (
        <div
          key={t.handle}
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b border-border/60 py-3 last:border-0"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0">
              <span className="block truncate font-mono text-[13px] font-semibold text-text-1">
                {t.handle}
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-text-3">
                {t.style}
              </span>
            </span>
            <Sparkline data={t.spark} width={56} height={18} className="shrink-0 max-sm:hidden" />
          </span>
          <span className="text-right font-mono text-[13px] font-bold tabular-nums text-mint">
            {t.ret}
          </span>
          <span className="text-right font-mono text-[12px] tabular-nums text-text-2">
            {t.win}
          </span>
          <span className="text-right font-mono text-[12px] tabular-nums text-red">{t.dd}</span>
        </div>
      ))}
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
        12-month minimum · every stat rebuilt from real brokerage fills
      </p>
    </Panel>
  );
}

/* ---------- Phase 03 visual: draggable allocation slider ---------- */

const ACCOUNT_EQUITY = 25_000;

function MirrorVisual() {
  const [alloc, setAlloc] = useState(12);
  const maxDollars = (alloc / 100) * ACCOUNT_EQUITY;
  return (
    <Panel label="ALLOCATION · LIVE SIZE CHECK" bodyClassName="p-5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3">
          Max allocation per trader
        </span>
        <span className="font-mono text-xl font-bold tabular-nums text-cyan">{alloc}%</span>
      </div>
      <input
        type="range"
        min={1}
        max={25}
        step={1}
        value={alloc}
        onChange={(e) => setAlloc(parseInt(e.target.value, 10))}
        aria-label="Max allocation per trader"
        className="mt-4 w-full cursor-pointer accent-[#22d3ee]"
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-text-3">
        <span>1%</span>
        <span>25%</span>
      </div>
      <div className="mt-4 rounded border border-cyan/40 bg-cyan-dim px-3 py-2.5 font-mono text-[13px] tabular-nums text-text-1">
        {alloc}% of $25,000 →{' '}
        <span className="font-bold text-cyan">${maxDollars.toLocaleString('en-US')}</span> max per
        trader
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] tabular-nums text-text-2">
          PER-TRADE CAP 25 SHR / 10 CTRS
        </span>
        <span className="rounded border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] tabular-nums text-text-2">
          KILL SWITCH -20% · FLATTEN
        </span>
      </div>
    </Panel>
  );
}

/* ---------- Rows ---------- */

const PHASES = [
  {
    num: '01',
    label: 'CONNECT',
    title: 'Your broker stays the broker.',
    body: 'Link your brokerage with an OAuth-style connection scoped to read positions and place orders — nothing else. Withdrawals are impossible at the API layer, and you can revoke access from your broker at any time.',
    visual: <ConnectVisual />,
  },
  {
    num: '02',
    label: 'CHOOSE',
    title: 'Pick traders on evidence.',
    body: 'Every leaderboard stat is audited against connected brokerage fills with a 12-month minimum history. Sort by what matters to you — return, win rate, drawdown — and inspect the fills before you mirror a cent.',
    visual: <ChooseVisual />,
  },
  {
    num: '03',
    label: 'MIRROR',
    title: 'Set limits once. We enforce forever.',
    body: 'Allocation percentage, per-trade caps, and a drawdown kill switch. Every signal passes through the risk engine before your broker ever sees it — no exceptions, no overrides.',
    visual: <MirrorVisual />,
  },
];

function PhaseRow({
  phase,
  flip,
}: {
  phase: (typeof PHASES)[number];
  flip: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  return (
    <div ref={ref} className="grid items-center gap-10 md:grid-cols-5">
      <div className={cn('md:col-span-3', flip && 'md:order-2')}>
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
          {phase.num} — {phase.label}
        </div>
        <h3 className="mt-3 font-sans text-2xl font-semibold tracking-[-0.01em] text-text-1">
          {phase.title.split(' ').map((w, i) => (
            <span
              key={i}
              className={cn('inline-block', inView && 'reveal')}
              style={
                {
                  ['--reveal-delay' as string]: `${i * 0.06}s`,
                  ['--reveal-y' as string]: '18px',
                }
              }
            >
              {w}&nbsp;
            </span>
          ))}
        </h3>
        <p
          className={cn(
            'mt-4 max-w-[560px] font-sans text-[15px] leading-[1.65] text-text-2',
            inView && 'reveal',
          )}
          style={{ ['--reveal-delay' as string]: '0.35s', ['--reveal-y' as string]: '14px' }}
        >
          {phase.body}
        </p>
      </div>
      <div
        className={cn(
          'transition-[opacity,transform] ease-out-expo md:col-span-2',
          flip && 'md:order-1',
          inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        )}
        style={{ transitionDuration: '600ms' }}
      >
        {phase.visual}
      </div>
    </div>
  );
}

/** Section 3 — the three phases, expanded, with interactive visuals. */
export default function Phases() {
  return (
    <section className="mx-auto max-w-[1280px] space-y-24 px-6 py-24">
      {PHASES.map((p, i) => (
        <PhaseRow key={p.num} phase={p} flip={i % 2 === 1} />
      ))}
    </section>
  );
}
