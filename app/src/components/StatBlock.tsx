import { useEffect, useRef, useState } from 'react';
import { useInView, usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

/** Label + Data XL value + optional delta chip. Value counts up when scrolled into view. */
export default function StatBlock({
  label,
  value,
  format,
  delta,
  caret = true,
  className,
  duration = 1.2,
}: {
  label: string;
  value: number;
  /** formats the animated value, e.g. v => `$${Math.round(v)}M+` */
  format: (v: number) => string;
  delta?: number;
  caret?: boolean;
  className?: string;
  duration?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) return;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(value * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [inView, value, duration, reduced]);

  return (
    <div ref={ref} className={cn('flex flex-col justify-center gap-1', className)}>
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-text-3">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5 font-mono text-[32px] font-bold leading-none tabular-nums text-text-1">
        {caret && <span className="text-sm text-cyan">▲</span>}
        {format(reduced ? value : display)}
        {delta !== undefined && (
          <span className={cn('ml-1 text-sm font-semibold', delta >= 0 ? 'text-mint' : 'text-red')}>
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(2)}%
          </span>
        )}
      </span>
    </div>
  );
}
