import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { usePrefersReducedMotion } from '@/hooks/useInView';
import { useSimulatedMarket } from '@/hooks/useSimulatedMarket';
import AppBar from './demo/AppBar';
import ChartPanel from './demo/ChartPanel';
import RightRail, { AlertsPanel, FlowPanel, PositionsPanel } from './demo/RightRail';
import StatusBar from './demo/StatusBar';
import WatchlistRail, { WatchlistChips } from './demo/WatchlistRail';
import { TIMEFRAMES, type ChartType, type Timeframe, type ViewTab } from './demo/data';

const VALID_SYMBOLS = new Set(['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMD', 'META', 'AMZN', 'JPM', 'GOOGL', 'SPY', 'QQQ', 'XOM']);

/**
 * `/demo` — full-viewport mission-control terminal running on simulated live
 * data. App bar + 280px watchlist rail + fluid chart/trade strip + 380px right
 * rail + 28px status bar. Stacks vertically below lg. Stocks & options only.
 */
export default function Demo() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reduced = usePrefersReducedMotion();
  useSimulatedMarket(); // boot the shared engine

  const initial = params.get('symbol')?.toUpperCase();
  const [symbol, setSymbol] = useState(initial && VALID_SYMBOLS.has(initial) ? initial : 'AAPL');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [activeView, setActiveView] = useState<ViewTab>('TERMINAL');
  const [focusNonce, setFocusNonce] = useState(0);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const handleViewChange = useCallback((v: ViewTab) => {
    setActiveView(v);
    setFocusNonce((n) => n + 1);
  }, []);

  // keyboard hints: [/] search · [1-5] timeframes · [esc] exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
      if (e.key === 'Escape') {
        navigate('/');
        return;
      }
      if (typing) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      const idx = ['1', '2', '3', '4', '5'].indexOf(e.key);
      if (idx >= 0) setTimeframe(TIMEFRAMES[idx]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="relative bg-bg">
      {/* faint blueprint grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: 'url(/grid-texture.png)', backgroundRepeat: 'repeat' }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col lg:h-[calc(100dvh-64px)] lg:overflow-hidden">
        <AppBar activeView={activeView} onViewChange={handleViewChange} reduced={reduced} />

        {/* desktop: 3-zone mission control · mobile: stacked */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="hidden min-h-0 lg:flex">
            <WatchlistRail ref={searchRef} active={symbol} onSelect={setSymbol} reduced={reduced} />
          </div>

          <ChartPanel
            symbol={symbol}
            timeframe={timeframe}
            chartType={chartType}
            onTimeframe={setTimeframe}
            onChartType={setChartType}
            reduced={reduced}
          />

          <div className="hidden min-h-0 lg:flex">
            <RightRail
              focusView={activeView}
              focusNonce={focusNonce}
              onSelectSymbol={setSymbol}
              reduced={reduced}
            />
          </div>

          {/* mobile stacking fallback (<lg): positions, flow, alerts, watchlist chips */}
          <div className="flex flex-col lg:hidden">
            <div className="border-t border-border">
              <PositionsPanel onSelect={setSymbol} reduced={reduced} />
            </div>
            <div className="border-t border-border">
              <FlowPanel reduced={reduced} />
            </div>
            <div className="border-t border-border">
              <AlertsPanel reduced={reduced} />
            </div>
            <WatchlistChips active={symbol} onSelect={setSymbol} />
          </div>
        </div>

        <StatusBar reduced={reduced} />
      </div>
    </div>
  );
}
