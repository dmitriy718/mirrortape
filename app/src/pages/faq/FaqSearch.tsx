import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search } from 'lucide-react';
import { FAQ_COUNT } from '@/pages/faq/data';
import { EASE_OUT_EXPO, TypedLabel, WordReveal } from '@/pages/pricing/reveal';
import { cn } from '@/lib/utils';

/** Section 1 — page header + live search input (`/` focuses, `esc` clears). */
export default function FaqSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onChange]);

  return (
    <section className="mx-auto max-w-[840px] px-6 pt-20">
      <TypedLabel text="SUPPORT" />
      <WordReveal
        text="Straight answers, no fine print games."
        className="mt-4 font-sans text-[44px] font-extrabold leading-[1.1] tracking-[-0.03em] text-text-1 max-md:text-4xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0.01 : 0.4, ease: EASE_OUT_EXPO, delay: 0.3 }}
        className={cn(
          'relative mt-10 flex h-14 items-center gap-3 rounded-md border bg-surface-2 px-4',
          'transition-colors duration-150',
          focused ? 'border-cyan' : 'border-border',
        )}
      >
        <Search size={16} className="shrink-0 text-text-3" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`Search ${FAQ_COUNT} questions…`}
          aria-label="Search frequently asked questions"
          className="h-full w-full bg-transparent font-mono text-sm text-text-1 caret-cyan outline-none placeholder:text-text-3"
        />
        {/* blinking cyan block cursor in the empty, unfocused field */}
        {value === '' && !focused && (
          <span
            className="cursor-blink pointer-events-none absolute left-9 top-1/2 h-[16px] w-2 -translate-y-1/2 bg-cyan"
            aria-hidden="true"
          />
        )}
        <kbd className="shrink-0 font-mono text-[11px] text-text-3">[/]</kbd>
      </motion.div>
    </section>
  );
}
