import { memo, useCallback } from 'react';
import LiveDot from '@/components/LiveDot';
import { useSimulatedMarket } from '@/hooks/useSimulatedMarket';
import { TAPE_SYMBOLS } from '@/lib/marketEngine';
import { cn } from '@/lib/utils';

function TapeItem({
  symbol,
  onSelect,
}: {
  symbol: string;
  onSelect?: (symbol: string) => void;
}) {
  const market = useSimulatedMarket();
  const s = market.get(symbol);
  const up = s.deltaPct >= 0;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(symbol)}
      className="flex shrink-0 cursor-pointer items-center gap-2 px-3 py-0.5 transition-colors duration-150 hover:bg-surface-3"
    >
      <span className="font-mono text-[13px] font-bold text-text-1">{s.symbol}</span>
      <span
        key={s.tickId}
        className={cn(
          'font-mono text-xs tabular-nums text-text-2',
          s.tickDir !== 0 && (s.tickDir > 0 ? 'flash-mint' : 'flash-red'),
        )}
      >
        {s.price.toFixed(2)}
      </span>
      <span
        className={cn(
          'rounded px-1 py-px font-mono text-[10px] font-semibold tabular-nums',
          up ? 'bg-[rgba(52,211,153,0.08)] text-mint' : 'bg-[rgba(248,113,113,0.08)] text-red',
        )}
      >
        {up ? '+' : ''}
        {s.deltaPct.toFixed(2)}%
      </span>
    </button>
  );
}

/**
 * Full-bleed 40px ticker strip. Left-fixed "US MARKETS" label cell with cyan
 * LiveDot; marquee of stock/ETF symbols (48s linear, pauses on hover).
 */
function TickerTapeInner({
  onSelectSymbol,
  className,
}: {
  onSelectSymbol?: (symbol: string) => void;
  className?: string;
}) {
  const handleSelect = useCallback(
    (symbol: string) => {
      if (onSelectSymbol) {
        onSelectSymbol(symbol);
        return;
      }
      // default: notify listeners and scroll to the hero dashboard if present
      window.dispatchEvent(new CustomEvent('mirrortape:symbol', { detail: symbol }));
      document.getElementById('hero-dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [onSelectSymbol],
  );

  const track = (
    <>
      {TAPE_SYMBOLS.map(({ symbol }) => (
        <TapeItem key={symbol} symbol={symbol} onSelect={handleSelect} />
      ))}
    </>
  );

  return (
    <div className={cn('ticker-tape flex h-10 items-stretch border-b border-border bg-surface-1', className)}>
      <div className="flex w-[88px] shrink-0 items-center gap-1.5 border-r border-border px-3">
        <LiveDot variant="cyan" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
          US Markets
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track flex h-full w-max items-center gap-6">
          {track}
          {track}
        </div>
      </div>
    </div>
  );
}

const TickerTape = memo(TickerTapeInner);
export default TickerTape;
