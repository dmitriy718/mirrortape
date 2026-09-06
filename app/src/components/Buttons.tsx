import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Primary CTA: cyan bg, dark text, mono 12px/700 uppercase, 6px radius, cyan glow hover. */
export const PrimaryButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function PrimaryButton({ className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-cyan px-5 py-2.5',
          'font-mono text-xs font-bold uppercase tracking-[0.08em] text-bg',
          'transition-[filter,box-shadow,transform] duration-150 ease-out-expo',
          'hover:brightness-110 hover:shadow-cyan-glow active:scale-[0.97]',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

/** Ghost button: 1px border, hover border-cyan + text-cyan. */
export const GhostButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function GhostButton({ className, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-transparent px-5 py-2.5',
          'font-mono text-xs font-semibold uppercase tracking-[0.08em] text-text-1',
          'transition-colors duration-150 hover:border-cyan hover:text-cyan',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
