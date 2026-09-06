import { useId, useMemo } from 'react';
import { useInView, usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

/** Inline SVG sparkline, 1.5px stroke, mint/red by period delta, 8% area fill, draw-on in view. */
export default function Sparkline({
  data,
  width = 96,
  height = 28,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  const id = useId();
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const reduced = usePrefersReducedMotion();

  const { path, area, length, up } = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const pts = data.map(
      (v, i) => [i * stepX, height - 2 - ((v - min) / range) * (height - 4)] as const,
    );
    const p = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const a = `${p} L${width},${height} L0,${height} Z`;
    // approximate path length for dash animation
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    return { path: p, area: a, length: len, up: data[data.length - 1] >= data[0] };
  }, [data, width, height]);

  const color = up ? 'var(--mint)' : 'var(--red)';
  const animate = inView && !reduced;

  return (
    <span ref={ref} className={cn('inline-flex', className)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path d={area} fill={color} opacity={0.08} />
        <path
          key={id}
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={animate || inView ? 0 : length}
          style={
            animate
              ? { transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }
              : undefined
          }
        />
      </svg>
    </span>
  );
}
