import { forwardRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import DeltaChip from '@/components/DeltaChip';
import LiveDot from '@/components/LiveDot';
import Sparkline from '@/components/Sparkline';
import { useSymbolState } from '@/hooks/useSimulatedMarket';
import { cn } from '@/lib/utils';
import { fmtMoney, MIRRORED_TRADERS, WATCHLIST } from './data';

function WatchlistRow({
  symbol,
  name,
  index,
  active,
  reduced,
  onClick,
}: {
  symbol: string;
  name: string;
  index: number;
  active: boolean;
  reduced: boolean;
  onClick: () => void;
}) {
  const s = useSymbolState(symbol);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduced ? false : { x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative flex h-16 w-full cursor-pointer items-center gap-3 border-b border-border/60 px-3 text-left transition-colors duration-150',
        active ? 'bg-cyan-dim' : 'hover:bg-surface-3',
      )}
    >
      {active && (
        <span className="absolute inset-y-0 left-0 w-0.5 bg-cyan transition-all duration-200" aria-hidden="true" />
      )}
      <Sparkline data={s.spark} width={64} height={20} className="shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-[13px] font-bold text-text-1">{s.symbol}</span>
        <span className="truncate font-mono text-[10px] text-text-3">{name}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span
          key={s.tickId}
          className={cn(
            'font-mono text-[13px] tabular-nums text-text-1',
            !reduced && s.tickDir !== 0 && (s.tickDir > 0 ? 'flash-mint' : 'flash-red'),
          )}
        >
          {s.price.toFixed(2)}
        </span>
        <DeltaChip value={s.deltaPct} />
      </span>
    </motion.button>
  );
}

function TraderRow({ handle, avatar, pnl, index, reduced }: { handle: string; avatar: string; pnl: number; index: number; reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.5 + index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2.5 border-b border-border/60 px-3 py-2.5 last:border-0"
    >
      <img src={avatar} alt="" className="h-6 w-6 shrink-0 rounded-full border border-border" />
      <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-semibold text-text-1">
        {handle}
      </span>
      <span
        className={cn(
          'font-mono text-[11px] tabular-nums',
          pnl >= 0 ? 'text-mint' : 'text-red',
        )}
      >
        {fmtMoney(pnl)}
      </span>
      <LiveDot variant="mint" />
    </motion.div>
  );
}

/** Zone 1 — left watchlist rail (280px): search, 12 symbol rows, mirrored traders. */
const WatchlistRail = forwardRef<HTMLInputElement, {
  active: string;
  onSelect: (symbol: string) => void;
  reduced: boolean;
}>(function WatchlistRail({ active, onSelect, reduced }, searchRef) {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return WATCHLIST;
    return WATCHLIST.filter(
      (w) => w.symbol.includes(q) || w.name.toUpperCase().includes(q),
    );
  }, [query]);

  return (
    <aside className="flex min-h-0 w-[280px] shrink-0 flex-col border-r border-border bg-surface-1/40" aria-label="Watchlist">
      {/* header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Watchlist
        </span>
        <button
          type="button"
          aria-label="Add symbol"
          className="cursor-pointer rounded border border-border p-1 text-text-3 transition-colors duration-150 hover:border-cyan hover:text-cyan"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* search */}
      <div className="shrink-0 border-b border-border p-2">
        <div className="flex items-center gap-2 rounded bg-surface-2 px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-text-3" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbols…"
            className="w-full bg-transparent font-mono text-xs text-text-1 outline-none placeholder:text-text-3"
          />
        </div>
      </div>
      {/* rows */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((w, i) => (
          <WatchlistRow
            key={w.symbol}
            symbol={w.symbol}
            name={w.name}
            index={i}
            active={active === w.symbol}
            reduced={reduced}
            onClick={() => onSelect(w.symbol)}
          />
        ))}
        {rows.length === 0 && (
          <div className="px-3 py-6 text-center font-mono text-[11px] text-text-3">
            No symbols match “{query}”
          </div>
        )}
      </div>
      {/* mirrored traders sub-panel */}
      <div className="shrink-0 border-t border-border">
        <div className="flex h-11 items-center justify-between border-b border-border px-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
            Mirrored traders
          </span>
          <LiveDot variant="mint" />
        </div>
        {MIRRORED_TRADERS.map((t, i) => (
          <TraderRow key={t.handle} handle={t.handle} avatar={t.avatar} pnl={t.todayPnl} index={i} reduced={reduced} />
        ))}
      </div>
    </aside>
  );
});

export default WatchlistRail;

/** Mobile fallback: horizontal symbol chips. */
export function WatchlistChips({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (symbol: string) => void;
}) {
  return (
    <section className="border-t border-border lg:hidden" aria-label="Watchlist symbols">
      <div className="flex h-11 items-center border-b border-border px-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Watchlist
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {WATCHLIST.map((w) => (
          <Chip key={w.symbol} symbol={w.symbol} active={active === w.symbol} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function Chip({ symbol, active, onSelect }: { symbol: string; active: boolean; onSelect: (s: string) => void }) {
  const s = useSymbolState(symbol);
  return (
    <button
      type="button"
      onClick={() => onSelect(symbol)}
      className={cn(
        'flex shrink-0 cursor-pointer items-center gap-2 rounded border px-3 py-2 transition-colors duration-150',
        active ? 'border-cyan bg-cyan-dim' : 'border-border bg-surface-1 hover:bg-surface-3',
      )}
    >
      <span className="font-mono text-[13px] font-bold text-text-1">{symbol}</span>
      <span className="font-mono text-[11px] tabular-nums text-text-2">{s.price.toFixed(2)}</span>
      <DeltaChip value={s.deltaPct} />
    </button>
  );
}
