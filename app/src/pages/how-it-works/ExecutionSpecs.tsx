import StatBlock from '@/components/StatBlock';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const SPECS = [
  {
    label: 'MEDIAN SIGNAL → ORDER RELAY',
    value: 38,
    format: (v: number) => `~${Math.round(v)}ms`,
  },
  {
    label: 'RISK-ENGINE MONITORING',
    value: 24,
    format: (v: number) => `${Math.round(v)}/7`,
  },
  {
    label: 'OF ORDERS PASS USER LIMITS',
    value: 100,
    format: (v: number) => `${Math.round(v)}%`,
  },
  {
    label: 'FUNDS HELD BY MIRRORTAPE',
    value: 0,
    format: (v: number) => `${Math.round(v)}`,
  },
];

/** Section 5 — full-bleed execution specs strip with drawing hairline dividers. */
export default function ExecutionSpecs() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  return (
    <section className="border-y border-border bg-surface-1">
      <div
        ref={ref}
        className="mx-auto grid max-w-[1280px] grid-cols-2 gap-y-10 px-6 py-14 lg:grid-cols-4"
      >
        {SPECS.map((s, i) => (
          <div key={s.label} className="relative px-2 lg:px-6">
            {i > 0 && (
              <span
                className="absolute left-0 top-1/2 hidden h-12 w-px origin-center bg-border lg:block"
                style={{
                  transform: `translateY(-50%) scaleY(${inView ? 1 : 0})`,
                  transition: `transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s`,
                }}
                aria-hidden="true"
              />
            )}
            <StatBlock
              label={s.label}
              value={s.value}
              format={s.format}
              caret={false}
              duration={1.1}
              className={cn(i === 0 && '[&_span:last-child]:text-cyan')}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
