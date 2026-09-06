import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface FaqItem {
  q: string;
  a: string;
}

/** Hairline-divided accordion: mono 14px question, plus rotates 45°, 0.42s expo collapse. */
export default function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={cn('divide-y divide-border border-y border-border', className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-mono text-sm font-semibold text-text-1">{item.q}</span>
              <span
                className={cn(
                  'shrink-0 font-mono text-lg leading-none text-cyan transition-transform duration-300 ease-out-expo',
                  isOpen && 'rotate-45',
                )}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] ease-out-expo"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', transitionDuration: '420ms' }}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    'pb-4 pr-8 font-sans text-[15px] leading-relaxed text-text-2 transition-opacity duration-300',
                    isOpen ? 'opacity-100 delay-200' : 'opacity-0',
                  )}
                >
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
