import StatBlock from '@/components/StatBlock';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const STATS = [
  { label: 'Copied Volume YTD', value: 412, format: (v: number) => `$${Math.round(v)}M+` },
  { label: 'Verified Traders', value: 1208, format: (v: number) => Math.round(v).toLocaleString('en-US') },
  { label: 'Median Mirror Latency', value: 38, format: (v: number) => `~${Math.round(v)}ms` },
  { label: 'Platform Uptime', value: 99.98, format: (v: number) => `${v.toFixed(2)}%` },
];

/** Section 3 — full-bleed 4-stat strip with count-up on view. */
export default function StatsStrip() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  return (
    <section className="border-y border-border bg-surface-1">
      <div
        ref={ref}
        className="mx-auto grid max-w-[1280px] grid-cols-2 divide-x divide-border lg:grid-cols-4"
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={cn('h-24 px-6 py-4', inView && 'reveal')}
            style={{ ['--reveal-delay' as string]: `${i * 0.12}s`, ['--reveal-y' as string]: '12px' }}
          >
            <StatBlock label={s.label} value={s.value} format={s.format} className="h-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
