import { useState } from 'react';
import { Shield, Gauge, SlidersHorizontal, OctagonX } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';
import GaugeMeter from '@/components/GaugeMeter';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const CELLS = [
  {
    icon: Shield,
    title: 'Allocation caps',
    body: 'Cap any trader at 1–25% of your portfolio. MirrorTape auto-sizes every mirrored position.',
  },
  {
    icon: Gauge,
    title: 'Drawdown kill switch',
    body: 'If a mirrored trader breaches your max drawdown, copying halts and positions flatten per your preset.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Per-trade limits',
    body: 'Max contracts per options trade, max notional per equity trade, sector concentration limits.',
  },
  {
    icon: OctagonX,
    title: 'One-tap stop',
    body: 'Flatten everything copied, instantly, from any screen. Your broker executes — we just relay.',
  },
];

/** Section 7 — risk controls feature grid + live GaugeMeter demo. */
export default function RiskGrid() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const [tolerance, setTolerance] = useState(12);

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <SectionHeader label="RISK ENGINE" title="Your limits. Enforced on every order." />
      <div
        ref={ref}
        className="grid overflow-hidden rounded-[10px] border border-border bg-surface-1 md:grid-cols-2 lg:grid-cols-3"
      >
        {CELLS.map((c, i) => (
          <div
            key={c.title}
            className={cn(
              'border-b border-border p-6 md:border-r md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0',
              inView && 'reveal',
            )}
            style={{ ['--reveal-delay' as string]: `${i * 0.1}s`, ['--reveal-y' as string]: '28px' }}
          >
            <c.icon size={20} className="text-cyan" strokeWidth={1.75} />
            <h3 className="mt-3 font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-text-1">
              {c.title}
            </h3>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-2">{c.body}</p>
          </div>
        ))}

        {/* gauge demo cell (spans 2 on lg) */}
        <div
          className={cn('p-6 lg:col-span-2', inView && 'reveal')}
          style={{ ['--reveal-delay' as string]: '0.4s', ['--reveal-y' as string]: '28px' }}
        >
          <div className="flex flex-wrap items-center gap-8">
            <GaugeMeter value={tolerance} max={30} label="MAX DD" />
            <div className="min-w-[220px] flex-1">
              <label
                htmlFor="dd-slider"
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3"
              >
                Max Drawdown Tolerance
              </label>
              <input
                id="dd-slider"
                type="range"
                min={5}
                max={30}
                step={0.5}
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                className="mt-3 w-full cursor-pointer accent-[#22d3ee]"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-text-3">
                <span>5%</span>
                <span>30%</span>
              </div>
              <p className="mt-4 font-mono text-[13px] tabular-nums text-text-1">
                Copying halts at{' '}
                <span className="font-bold text-red">-{tolerance.toFixed(1)}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
