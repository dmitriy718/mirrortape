import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

/** Bracketed cyan mono label + H2 + optional right-side link. Bottom margin 48px. */
export default function SectionHeader({
  label,
  title,
  linkText,
  linkTo,
  center = false,
  className,
}: {
  label: string;
  title: ReactNode;
  linkText?: string;
  linkTo?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('mb-12', center ? 'text-center' : 'flex items-end justify-between gap-6', className)}>
      <div>
        <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
          [ {label} ]
        </div>
        <h2 className="font-sans text-4xl font-bold tracking-[-0.02em] text-text-1 max-md:text-3xl">
          {title}
        </h2>
      </div>
      {linkText && linkTo && (
        <Link
          to={linkTo}
          className="shrink-0 font-mono text-xs font-semibold tracking-[0.06em] text-cyan transition-colors duration-150 hover:brightness-125"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
}
