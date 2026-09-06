import { cn } from '@/lib/utils';

const SEVERITY = {
  info: 'var(--cyan)',
  warning: 'var(--amber)',
  critical: 'var(--red)',
} as const;

/** Alert card with 3px severity edge, mono title, Inter body, micro timestamp. */
export default function AlertCard({
  severity = 'info',
  title,
  body,
  time,
  className,
}: {
  severity?: keyof typeof SEVERITY;
  title: string;
  body: string;
  time: string;
  className?: string;
}) {
  return (
    <div
      className={cn('rounded-r-md bg-surface-1 py-2.5 pl-3 pr-3', className)}
      style={{ borderLeft: `3px solid ${SEVERITY[severity]}` }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[13px] font-semibold text-text-1">{title}</span>
        <span className="shrink-0 font-mono text-[10px] text-text-3">{time}</span>
      </div>
      <p className="mt-1 font-sans text-sm leading-relaxed text-text-2">{body}</p>
    </div>
  );
}
