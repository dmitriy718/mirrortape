import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';
import { SORT_OPTIONS } from './data';
import type { Instrument, SortKey, Strategy } from './data';

const STRATEGIES: Array<'ALL' | Strategy> = ['ALL', 'SWING', 'DAY', 'POSITION'];
const INSTRUMENTS: Array<'ALL' | Instrument> = ['ALL', 'STOCKS', 'OPTIONS', 'MIXED'];

/** Segmented toggle group with a shared-element cyan wash sliding between segments. */
function SegmentGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  groupId,
}: {
  legend: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  groupId: string;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
        {legend}:
      </span>
      <div className="flex rounded border border-border bg-surface-2 p-0.5" role="group" aria-label={legend}>
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={cn(
                'relative cursor-pointer rounded px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.06em]',
                'transition-colors duration-150',
                active ? 'text-cyan' : 'text-text-3 hover:text-text-1',
              )}
            >
              {active && (
                <motion.span
                  layoutId={`seg-${groupId}`}
                  className="absolute inset-0 rounded bg-cyan-dim"
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 420, damping: 34, duration: 0.25 }
                  }
                  aria-hidden="true"
                />
              )}
              <span className="relative">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Mono sort dropdown: `SORT: 12M RETURN ▾`. */
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.key === value) ?? SORT_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded border border-border bg-surface-2 px-3 py-1.5',
          'font-mono text-[11px] font-semibold tracking-[0.06em] text-text-1',
          'transition-colors duration-150 hover:border-cyan hover:text-cyan',
        )}
      >
        <span className="text-text-3">SORT:</span> {current.label}
        <ChevronDown size={13} className={cn('transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 min-w-[190px] overflow-hidden rounded-md border border-border bg-surface-1 py-1"
        >
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              role="option"
              aria-selected={o.key === value}
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
              className={cn(
                'block w-full cursor-pointer px-3 py-2 text-left font-mono text-[11px] font-semibold tracking-[0.06em]',
                'transition-colors duration-150',
                o.key === value ? 'bg-cyan-dim text-cyan' : 'text-text-2 hover:bg-surface-3 hover:text-text-1',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Section 2 — sticky filter/sort/search bar. Sticks below the shrunken navbar
 * (52px) and gains blur + hairline with a 0.25s transition when engaged.
 */
export default function FilterBar({
  strategy,
  instrument,
  sort,
  query,
  onStrategy,
  onInstrument,
  onSort,
  onQuery,
}: {
  strategy: 'ALL' | Strategy;
  instrument: 'ALL' | Instrument;
  sort: SortKey;
  query: string;
  onStrategy: (v: 'ALL' | Strategy) => void;
  onInstrument: (v: 'ALL' | Instrument) => void;
  onSort: (v: SortKey) => void;
  onQuery: (v: string) => void;
}) {
  const [stuck, setStuck] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const topRef = useRef(0);

  useEffect(() => {
    const measure = () => {
      if (barRef.current) topRef.current = barRef.current.getBoundingClientRect().top + window.scrollY;
    };
    measure();
    const onScroll = () => setStuck(window.scrollY >= topRef.current - 52);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div
      ref={barRef}
      className={cn(
        'sticky top-[52px] z-40 border-b transition-[background-color,border-color] duration-[250ms]',
        stuck
          ? 'border-border bg-surface-1/90 backdrop-blur-[12px]'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <SegmentGroup legend="STRATEGY" options={STRATEGIES} value={strategy} onChange={onStrategy} groupId="strategy" />
          <SegmentGroup legend="INSTRUMENT" options={INSTRUMENTS} value={instrument} onChange={onInstrument} groupId="instrument" />
        </div>
        <div className="flex items-center gap-3">
          <SortDropdown value={sort} onChange={onSort} />
          <label className="relative block">
            <span className="sr-only">Search handles</span>
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search handles…"
              className={cn(
                'w-[180px] rounded border border-border bg-surface-2 py-1.5 pl-8 pr-3',
                'font-mono text-[11px] font-medium tracking-[0.04em] text-text-1 placeholder:text-text-3',
                'outline-none transition-colors duration-150 focus:border-cyan',
              )}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
