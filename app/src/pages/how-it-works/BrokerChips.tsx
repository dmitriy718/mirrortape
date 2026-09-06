import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const BROKERS = [
  'ALPACA',
  'INTERACTIVE BROKERS',
  'CHARLES SCHWAB',
  'WEBULL',
  'E*TRADE',
  'TASTYTRADE',
];

/** Section 4 — broker integration chips (mono text chips, no third-party logos). */
export default function BrokerChips() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <div className="mb-8">
        <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
          [ CONNECTIVITY ]
        </div>
        <h3 className="font-sans text-2xl font-semibold tracking-[-0.01em] text-text-1">
          Plugs into the brokers you already use.
        </h3>
      </div>
      <div ref={ref} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {BROKERS.map((b, i) => (
          <div
            key={b}
            className={cn(
              'flex h-12 cursor-default items-center justify-center rounded-md border border-border bg-surface-1 px-3',
              'font-mono text-xs font-semibold tracking-[0.08em] text-text-2',
              'transition-[border-color,color,transform] duration-150 hover:-translate-y-0.5 hover:border-cyan hover:text-cyan',
              inView && 'reveal',
            )}
            style={
              {
                ['--reveal-delay' as string]: `${i * 0.05}s`,
                ['--reveal-y' as string]: '10px',
              }
            }
          >
            {b}
          </div>
        ))}
        <button
          type="button"
          className={cn(
            'flex h-12 cursor-pointer items-center justify-center rounded-md border border-dashed border-cyan/60 bg-transparent px-3',
            'font-mono text-xs font-bold tracking-[0.08em] text-cyan',
            'transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-cyan-dim',
            inView && 'reveal',
          )}
          style={
            {
              ['--reveal-delay' as string]: `${BROKERS.length * 0.05}s`,
              ['--reveal-y' as string]: '10px',
            }
          }
        >
          + REQUEST YOURS
        </button>
      </div>
      <p className="mt-4 font-mono text-[10px] tracking-[0.04em] text-text-3">
        Brokerage services provided by your broker. MirrorTape never holds funds.
      </p>
    </section>
  );
}
