import LiveDot from '@/components/LiveDot';

/** Bottom status bar (28px): connection state, demo-mode notice, keyboard hints. */
export default function StatusBar({ reduced }: { reduced: boolean }) {
  return (
    <footer className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-border bg-surface-1 px-3 font-mono text-[10px] text-text-3">
      <span className="flex items-center gap-1.5 text-mint">
        <LiveDot variant={reduced ? 'amber' : 'mint'} />
        <span className="hidden sm:inline">CONNECTED (simulated)</span>
        <span className="sm:hidden">SIM CONNECTED</span>
      </span>
      <span className="hidden truncate md:inline">
        DEMO MODE — market data simulated, no real orders
      </span>
      <span className="hidden lg:inline">[/] search · [1-5] timeframes · [esc] exit</span>
    </footer>
  );
}
