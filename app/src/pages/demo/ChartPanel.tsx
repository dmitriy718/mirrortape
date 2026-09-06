import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChartCandlestick, ChartLine } from 'lucide-react';
import DeltaChip from '@/components/DeltaChip';
import { useSymbolState } from '@/hooks/useSimulatedMarket';
import { market, type MirrorEvent } from '@/lib/marketEngine';
import { cn } from '@/lib/utils';
import TerminalChart from './TerminalChart';
import { TIMEFRAMES, WATCHLIST, type ChartType, type Timeframe } from './data';

function companyName(symbol: string): string {
  return WATCHLIST.find((w) => w.symbol === symbol)?.name ?? symbol;
}

function formatFill(e: MirrorEvent): string {
  return e.action.replace('BOUGHT', 'BOT').replace('SOLD', 'SLD').replace(' @ ', ' @');
}

/** Center zone: symbol header bar, fluid terminal chart, live trade strip. */
export default function ChartPanel({
  symbol,
  timeframe,
  chartType,
  onTimeframe,
  onChartType,
  reduced,
}: {
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  onTimeframe: (tf: Timeframe) => void;
  onChartType: (t: ChartType) => void;
  reduced: boolean;
}) {
  const s = useSymbolState(symbol);
  const [fills, setFills] = useState<MirrorEvent[]>([]);
  const seenRef = useRef(0);

  // seed + live mirrored fills for the trade strip
  useEffect(() => {
    const seed: MirrorEvent[] = [];
    for (let i = 0; i < 6; i++) seed.push(market.randomFeedEvent());
    seenRef.current = seed[seed.length - 1]?.id ?? 0;
    setFills(seed.reverse());
    const unsub = market.subscribeFeed((e) => {
      if (e.id <= seenRef.current) return;
      seenRef.current = e.id;
      setFills((prev) => [e, ...prev].slice(0, 14));
    });
    return unsub;
  }, []);

  const o = s.spark[0] ?? s.price;
  const h = Math.max(...s.spark);
  const l = Math.min(...s.spark);

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Chart">
      {/* symbol header bar (56px) */}
      <div className="flex h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={symbol}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-baseline gap-2.5"
          >
            <span className="font-mono text-xl font-semibold text-text-1">{s.symbol}</span>
            <span className="hidden font-mono text-[11px] text-text-3 sm:inline">
              {companyName(symbol)}
            </span>
          </motion.div>
        </AnimatePresence>
        <span
          key={s.tickId}
          className={cn(
            'font-mono text-2xl font-bold tabular-nums text-text-1',
            !reduced && s.tickDir !== 0 && (s.tickDir > 0 ? 'flash-mint' : 'flash-red'),
          )}
        >
          {s.price.toFixed(2)}
        </span>
        <DeltaChip value={s.deltaPct} />
        <span className="hidden font-mono text-[10px] tabular-nums text-text-3 md:inline">
          O {o.toFixed(2)} H {h.toFixed(2)} L {l.toFixed(2)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {/* timeframe tabs */}
          <div className="flex items-center rounded border border-border bg-surface-2 p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframe(tf)}
                className={cn(
                  'cursor-pointer rounded px-2 py-1 font-mono text-[11px] font-semibold transition-colors duration-150',
                  timeframe === tf ? 'bg-cyan-dim text-cyan' : 'text-text-3 hover:text-text-1',
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          {/* chart-type toggle */}
          <div className="flex items-center rounded border border-border bg-surface-2 p-0.5">
            <button
              type="button"
              aria-label="Candlestick chart"
              onClick={() => onChartType('candles')}
              className={cn(
                'cursor-pointer rounded p-1.5 transition-colors duration-150',
                chartType === 'candles' ? 'bg-cyan-dim text-cyan' : 'text-text-3 hover:text-text-1',
              )}
            >
              <ChartCandlestick className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Line chart"
              onClick={() => onChartType('line')}
              className={cn(
                'cursor-pointer rounded p-1.5 transition-colors duration-150',
                chartType === 'line' ? 'bg-cyan-dim text-cyan' : 'text-text-3 hover:text-text-1',
              )}
            >
              <ChartLine className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* fluid chart */}
      <TerminalChart
        symbol={symbol}
        timeframe={timeframe}
        chartType={chartType}
        reduced={reduced}
        className="min-h-[420px] flex-1"
      />

      {/* trade strip (48px) — mirrored traders' recent fills */}
      <div className="flex h-12 shrink-0 items-center gap-2 overflow-hidden border-t border-border px-3">
        <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Mirrored fills
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AnimatePresence initial={false}>
            {fills.map((f) => (
              <motion.span
                key={f.id}
                initial={reduced ? false : { x: 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded bg-surface-2 py-1 pl-2 pr-2.5 font-mono text-[10px] tabular-nums text-text-2',
                )}
                style={{ borderLeft: `2px solid ${f.side === 'buy' ? 'var(--mint)' : 'var(--red)'}` }}
              >
                <span className={f.side === 'buy' ? 'text-mint' : 'text-red'}>
                  {formatFill(f)}
                </span>
                <span className="text-text-3">{f.time.slice(0, 5)}</span>
                <span className="hidden text-text-3 xl:inline">{f.trader}</span>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
