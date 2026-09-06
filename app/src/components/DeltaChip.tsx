import { cn } from '@/lib/utils';

/** Delta chip: mint/red text on 8% matching wash, 4px radius, tabular numerals, explicit sign. */
export default function DeltaChip({
  value,
  suffix = '%',
  className,
  plain = false,
}: {
  value: number;
  suffix?: string;
  className?: string;
  plain?: boolean;
}) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
        plain ? 'bg-transparent' : up ? 'bg-[rgba(52,211,153,0.08)]' : 'bg-[rgba(248,113,113,0.08)]',
        up ? 'text-mint' : 'text-red',
        className,
      )}
    >
      {up ? '+' : ''}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}
