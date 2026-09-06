import { useEffect, useRef, useState } from 'react';
import { useInView, usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

/** Semicircular risk gauge. Arc colored by zone: mint <40%, amber 40-70%, red >70%. */
export default function GaugeMeter({
  value,
  max,
  label,
  className,
  width = 220,
}: {
  value: number;
  max: number;
  label?: string;
  className?: string;
  width?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(0);
  const raf = useRef(0);
  const prevTarget = useRef(0);

  const pct = Math.min(1, Math.max(0, value / max));

  useEffect(() => {
    if (!inView) return;
    if (reduced) return;
    const from = prevTarget.current;
    const start = performance.now();
    const dur = 800;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (pct - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else prevTarget.current = pct;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [pct, inView, reduced]);

  const visible = reduced ? pct : shown;
  const zoneColor = visible < 0.4 ? 'var(--mint)' : visible <= 0.7 ? 'var(--amber)' : 'var(--red)';

  const h = width / 2;
  const r = width / 2 - 14;
  const cx = width / 2;
  const cy = h;
  // semicircle arc from 180° to 0°
  const arcPath = (fraction: number) => {
    const start = Math.PI;
    const end = Math.PI - fraction * Math.PI;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy - r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy - r * Math.sin(end);
    const large = fraction > 0.5 ? 1 : 0;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };

  return (
    <div ref={ref} className={cn('flex flex-col items-center', className)}>
      <svg width={width} height={h + 8} viewBox={`0 0 ${width} ${h + 8}`}>
        <path d={arcPath(1)} fill="none" stroke="var(--border)" strokeWidth={10} strokeLinecap="round" />
        {visible > 0.004 && (
          <path
            d={arcPath(visible)}
            fill="none"
            stroke={zoneColor}
            strokeWidth={10}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.3s ease' }}
          />
        )}
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fill="var(--text-1)"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={700}
          fontSize={24}
        >
          {(visible * max).toFixed(1)}%
        </text>
        {label && (
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill="var(--text-3)"
            fontFamily="'JetBrains Mono', monospace"
            fontSize={9}
            letterSpacing={1.5}
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
