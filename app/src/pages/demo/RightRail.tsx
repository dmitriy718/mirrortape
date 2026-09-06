import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import AlertCard from '@/components/AlertCard';
import LiveDot from '@/components/LiveDot';
import { useSimulatedMarket } from '@/hooks/useSimulatedMarket';
import { cn } from '@/lib/utils';
import {
  ALERT_POOL,
  ALERT_SEED,
  FLOW_POOL,
  FLOW_SEED,
  POSITIONS,
  fmtMoney,
  nowTime,
  positionMark,
  positionPnl,
  type DemoAlert,
  type FlowRow,
  type ViewTab,
} from './data';

const TAG_STYLE: Record<FlowRow['tag'], string> = {
  SWEEP: 'bg-cyan-dim text-cyan',
  BLOCK: 'bg-[rgba(251,191,36,0.1)] text-amber',
  SPLIT: 'bg-surface-3 text-text-2',
};

const EDGE: Record<FlowRow['sentiment'], string> = {
  mint: 'var(--mint)',
  red: 'var(--red)',
  amber: 'var(--amber)',
};

function PanelHeader({ label, right }: { label: string; right?: ReactNode }) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
        {label}
      </span>
      {right}
    </div>
  );
}

/* ---------------- 1. Copied positions ---------------- */

function PositionRow({
  position,
  onSelect,
  reduced,
}: {
  position: (typeof POSITIONS)[number];
  onSelect: (symbol: string) => void;
  reduced: boolean;
}) {
  const m = useSimulatedMarket();
  const live = m.get(position.underlying).price;
  const mark = positionMark(position, live);
  const pnl = positionPnl(position, live);
  const up = pnl >= 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(position.underlying)}
      className="grid w-full cursor-pointer grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-b border-border/60 px-4 py-2.5 text-left transition-colors duration-150 last:border-0 hover:bg-surface-3"
    >
      <span className="flex items-baseline gap-2">
        <span className="font-mono text-[13px] font-bold text-text-1">{position.label}</span>
        <span className="font-mono text-[10px] text-text-3">
          {position.qty} {position.kind === 'shares' ? 'sh' : 'ct'}
        </span>
      </span>
      <span
        className={cn(
          'text-right font-mono text-[13px] font-semibold tabular-nums',
          up ? 'text-mint' : 'text-red',
          !reduced && 'transition-colors duration-200',
        )}
      >
        {fmtMoney(pnl)}
      </span>
      <span className="font-mono text-[10px] tabular-nums text-text-3">
        avg {position.avg.toFixed(2)} · mark {mark.toFixed(2)}
      </span>
      <span className="text-right font-mono text-[10px] text-text-3">via {position.via}</span>
    </button>
  );
}

function PositionsPanel({ onSelect, reduced }: { onSelect: (s: string) => void; reduced: boolean }) {
  const m = useSimulatedMarket();
  const dayPnl = POSITIONS.reduce((sum, p) => sum + positionPnl(p, m.get(p.underlying).price), 0);
  return (
    <div>
      <PanelHeader
        label="Copied positions"
        right={
          <span
            className={cn(
              'font-mono text-lg font-semibold tabular-nums',
              dayPnl >= 0 ? 'text-mint' : 'text-red',
            )}
          >
            {fmtMoney(dayPnl)}
          </span>
        }
      />
      {POSITIONS.map((p) => (
        <PositionRow key={p.id} position={p} onSelect={onSelect} reduced={reduced} />
      ))}
    </div>
  );
}

/* ---------------- 2. Options flow ---------------- */

function FlowPanel({ reduced }: { reduced: boolean }) {
  const [rows, setRows] = useState<FlowRow[]>(FLOW_SEED);
  const idRef = useRef(FLOW_SEED.length);
  const poolRef = useRef(0);

  useEffect(() => {
    if (reduced) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!document.hidden) {
          const next = FLOW_POOL[poolRef.current++ % FLOW_POOL.length];
          setRows((prev) => [{ ...next, id: ++idRef.current, time: nowTime() }, ...prev].slice(0, 8));
        }
        schedule();
      }, 3000 + Math.random() * 2000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [reduced]);

  return (
    <div>
      <PanelHeader label="Options flow" right={<LiveDot variant="cyan" />} />
      <div>
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.div
              key={r.id}
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-b border-border/60 last:border-0"
              style={{ borderLeft: `3px solid ${EDGE[r.sentiment]}` }}
            >
              <div className="flex items-center gap-2.5 py-2 pl-2.5 pr-4">
                <span className="w-[52px] shrink-0 font-mono text-[10px] tabular-nums text-text-3">
                  {r.time}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[12px] font-bold text-text-1">
                  {r.contract}
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.08em]',
                    TAG_STYLE[r.tag],
                  )}
                >
                  {r.tag}
                </span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-text-2">
                  {r.premium}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------- 3. Alerts ---------------- */

function AlertsPanel({ reduced }: { reduced: boolean }) {
  const [alerts, setAlerts] = useState<DemoAlert[]>(ALERT_SEED);
  const idRef = useRef(ALERT_SEED.length);
  const poolRef = useRef(0);

  // sim events drop a new alert roughly every 20s, capped at 4 cards
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      const next = ALERT_POOL[poolRef.current++ % ALERT_POOL.length];
      setAlerts((prev) => [{ ...next, id: ++idRef.current, time: nowTime() }, ...prev].slice(0, 4));
    }, 20_000);
    return () => clearInterval(t);
  }, [reduced]);

  const dismiss = (id: number) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  return (
    <div>
      <PanelHeader label="Alerts" right={<LiveDot variant="amber" />} />
      <div className="flex flex-col gap-2 p-3">
        <AnimatePresence initial={false}>
          {alerts.map((a) => (
            <motion.div
              key={a.id}
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="group relative overflow-hidden"
            >
              <div className="relative">
                {/* pulsing severity bar on critical alerts */}
                {a.severity === 'critical' && !reduced && (
                  <motion.span
                    className="absolute inset-y-0 left-0 w-[3px] bg-red"
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    aria-hidden="true"
                  />
                )}
                <AlertCard severity={a.severity} title={a.title} body={a.body} time={a.time} />
                <button
                  type="button"
                  aria-label="Dismiss alert"
                  onClick={() => dismiss(a.id)}
                  className="absolute right-2 top-2.5 cursor-pointer rounded p-0.5 text-text-3 opacity-0 transition-opacity duration-150 hover:text-text-1 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
                {a.severity === 'critical' && (
                  <Link
                    to="/risk"
                    className="absolute bottom-2 right-2.5 font-mono text-[10px] font-semibold text-cyan opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    Adjust limits →
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {alerts.length === 0 && (
          <div className="py-4 text-center font-mono text-[11px] text-text-3">All clear.</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- right rail ---------------- */

/** Zone 3 — 380px right rail: positions / flow / alerts with view-tab focus. */
export default function RightRail({
  focusView,
  focusNonce,
  onSelectSymbol,
  reduced,
}: {
  focusView: ViewTab;
  focusNonce: number;
  onSelectSymbol: (s: string) => void;
  reduced: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const positionsRef = useRef<HTMLDivElement | null>(null);
  const flowRef = useRef<HTMLDivElement | null>(null);
  const alertsRef = useRef<HTMLDivElement | null>(null);
  const [highlight, setHighlight] = useState<ViewTab | null>(null);

  useEffect(() => {
    const target =
      focusView === 'POSITIONS' ? positionsRef.current
      : focusView === 'FLOW' ? flowRef.current
      : focusView === 'ALERTS' ? alertsRef.current
      : null;
    const scroller = scrollRef.current;
    if (scroller) {
      if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      else scroller.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    }
    if (focusView !== 'TERMINAL') {
      setHighlight(focusView);
      const t = setTimeout(() => setHighlight(null), 1400);
      return () => clearTimeout(t);
    }
  }, [focusView, focusNonce, reduced]);

  const ring = (tab: ViewTab) =>
    cn(
      'border-b border-border transition-shadow duration-300',
      highlight === tab && 'shadow-[inset_0_0_0_1px_var(--cyan)]',
    );

  return (
    <aside
      ref={scrollRef}
      className="min-h-0 w-[380px] shrink-0 overflow-y-auto border-l border-border bg-surface-1/40"
      aria-label="Positions, flow and alerts"
    >
      <motion.div
        initial={reduced ? false : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        ref={positionsRef}
        className={cn(ring('POSITIONS'), 'scroll-mt-2')}
      >
        <PositionsPanel onSelect={onSelectSymbol} reduced={reduced} />
      </motion.div>
      <motion.div
        initial={reduced ? false : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        ref={flowRef}
        className={cn(ring('FLOW'), 'scroll-mt-2')}
      >
        <FlowPanel reduced={reduced} />
      </motion.div>
      <motion.div
        initial={reduced ? false : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        ref={alertsRef}
        className={cn(ring('ALERTS'), 'scroll-mt-2 border-b-0')}
      >
        <AlertsPanel reduced={reduced} />
      </motion.div>
    </aside>
  );
}

/** Mobile stacked exports (rendered inline below the chart on <lg screens). */
export { PositionsPanel, FlowPanel, AlertsPanel };
