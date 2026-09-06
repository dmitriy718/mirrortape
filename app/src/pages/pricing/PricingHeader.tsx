import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE_OUT_EXPO, TypedLabel, WordReveal } from '@/pages/pricing/reveal';

/** Section 1 — page header + MONTHLY/ANNUAL billing toggle with sliding thumb. */
export default function PricingHeader({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (annual: boolean) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-20 text-center">
      <TypedLabel text="PRICING" />
      <WordReveal
        text="One subscription. Zero per-trade markups."
        className="mx-auto mt-4 max-w-[820px] font-sans text-5xl font-extrabold tracking-[-0.03em] text-text-1 max-md:text-4xl"
      />
      <motion.p
        initial={{ opacity: 0, y: reduced ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_EXPO, delay: 0.35 }}
        className="mx-auto mt-4 max-w-[620px] font-sans text-base leading-relaxed text-text-2"
      >
        Your broker&rsquo;s normal commissions and fees apply — MirrorTape never touches your fills
        or your funds.
      </motion.p>

      {/* Billing toggle */}
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_EXPO, delay: 0.5 }}
        className="mt-10 flex justify-center"
      >
        <div
          role="group"
          aria-label="Billing period"
          className="relative inline-flex rounded-full border border-border bg-surface-2 p-1"
        >
          {(
            [
              { id: false, label: 'MONTHLY' },
              { id: true, label: 'ANNUAL' },
            ] as const
          ).map((opt) => {
            const active = annual === opt.id;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onChange(opt.id)}
                aria-pressed={active}
                className={cn(
                  'relative cursor-pointer rounded-full px-5 py-2 font-mono text-xs font-bold tracking-[0.08em]',
                  'transition-colors duration-150',
                  active ? 'text-bg' : 'text-text-2 hover:text-text-1',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="billing-thumb"
                    className="absolute inset-0 rounded-full bg-cyan"
                    transition={
                      reduced
                        ? { duration: 0.01 }
                        : { type: 'spring', duration: 0.3, bounce: 0 }
                    }
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-2">
                  {opt.label}
                  {opt.id && (
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.06em]',
                        active ? 'bg-bg/20 text-bg' : 'bg-mint/10 text-mint',
                      )}
                    >
                      SAVE 20%
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
