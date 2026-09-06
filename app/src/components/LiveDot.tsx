import { cn } from '@/lib/utils';

type LiveDotVariant = 'cyan' | 'mint' | 'amber' | 'red';

const COLORS: Record<LiveDotVariant, string> = {
  cyan: 'var(--cyan)',
  mint: 'var(--mint)',
  amber: 'var(--amber)',
  red: 'var(--red)',
};

/** 6px pulsing live indicator. cyan=streaming, mint=connected, amber=delayed, red=halted. */
export default function LiveDot({
  variant = 'cyan',
  className,
}: {
  variant?: LiveDotVariant;
  className?: string;
}) {
  return (
    <span className={cn('relative inline-flex h-1.5 w-1.5 shrink-0', className)}>
      <span
        className="live-dot-pulse absolute inline-flex h-full w-full rounded-full"
        style={{ backgroundColor: COLORS[variant], opacity: 0.6 }}
      />
      <span
        className="relative inline-flex h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: COLORS[variant] }}
      />
    </span>
  );
}
