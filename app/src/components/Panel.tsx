import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Terminal panel: surface-1 bg, 1px border, 10px radius, 44px header row, hairline-separated body. */
export default function Panel({
  label,
  actions,
  children,
  className,
  bodyClassName,
}: {
  label?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-[10px] border border-border bg-surface-1', className)}>
      {label !== undefined && (
        <div className="flex h-11 items-center justify-between border-b border-border px-4">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
            {label}
          </span>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
