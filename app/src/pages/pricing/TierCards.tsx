import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { GhostButton, PrimaryButton } from '@/components/Buttons';
import { cn } from '@/lib/utils';
import { TIERS, type Tier } from '@/pages/pricing/data';
import { EASE_OUT_EXPO } from '@/pages/pricing/reveal';

/** Price numeral that count-tweens (0.4s) between monthly/annual values. */
function TweenedPrice({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => `$${Math.round(v)}`);

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.4, ease: EASE_OUT_EXPO });
    return () => controls.stop();
  }, [value, reduced, mv]);

  return <motion.span className="tabular-nums">{rounded}</motion.span>;
}

function TierCard({ tier, annual, index }: { tier: Tier; annual: boolean; index: number }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const price = annual ? tier.annual : tier.monthly;

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduced ? 0.01 : 0.6, ease: EASE_OUT_EXPO, delay: index * 0.12 }}
      className={cn(
        'relative flex h-full flex-col rounded-[10px] border bg-surface-1 p-7',
        'transition-[border-color,transform] duration-200 ease-out-expo hover:-translate-y-1',
        tier.popular
          ? 'border-cyan shadow-cyan-glow hover:border-cyan'
          : 'border-border hover:border-cyan/60',
      )}
    >
      {/* single glow pulse on entry for the popular tier */}
      {tier.popular && !reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[10px]"
          initial={{ boxShadow: '0 0 0px rgba(34,211,238,0)' }}
          whileInView={{
            boxShadow: [
              '0 0 0px rgba(34,211,238,0)',
              '0 0 48px rgba(34,211,238,0.35)',
              '0 0 24px rgba(34,211,238,0.15)',
            ],
          }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.2, times: [0, 0.4, 1], delay: index * 0.12 }}
          aria-hidden="true"
        />
      )}

      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan bg-bg px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan">
          Most Popular
        </span>
      )}

      <div
        className={cn(
          'font-mono text-xs font-bold uppercase tracking-[0.14em]',
          tier.popular ? 'text-cyan' : 'text-text-1',
        )}
      >
        {tier.name}
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={annual ? 'annual' : 'monthly'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.2 }}
            className="font-mono text-[40px] font-bold leading-none text-text-1"
          >
            <TweenedPrice value={price} />
          </motion.span>
        </AnimatePresence>
        <span className="font-mono text-[11px] text-text-3">/mo</span>
      </div>
      <div className="mt-1 h-4 font-mono text-[10px] tracking-[0.02em] text-text-3">
        {annual && tier.monthly > 0 ? `billed annually ($${tier.annual * 12}/yr)` : ' '}
      </div>

      <p className="mt-2 font-sans text-sm text-text-2">{tier.tagline}</p>

      <div className="my-6 border-t border-border" />

      <motion.ul
        className="flex flex-1 flex-col gap-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: index * 0.12 + 0.25 } } }}
      >
        {tier.features.map((f) => (
          <motion.li
            key={f.text}
            variants={{
              hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: reduced ? { duration: 0.01 } : { duration: 0.3, ease: EASE_OUT_EXPO },
              },
            }}
            className="flex items-start gap-2.5 font-mono text-[12.5px] leading-snug"
          >
            <motion.span
              variants={{
                hidden: reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: reduced ? { duration: 0.01 } : { duration: 0.3, ease: EASE_OUT_EXPO },
                },
              }}
              className={cn(
                'mt-px inline-block font-bold',
                f.included ? 'text-mint' : 'text-text-3',
              )}
              aria-hidden="true"
            >
              {f.included ? '✓' : '✕'}
            </motion.span>
            <span className={f.included ? 'text-text-1' : 'text-text-3'}>{f.text}</span>
          </motion.li>
        ))}
      </motion.ul>

      <div className="mt-8">
        {tier.ctaVariant === 'primary' ? (
          <PrimaryButton className="w-full py-3" onClick={() => navigate('/demo')}>
            {tier.cta}
          </PrimaryButton>
        ) : (
          <GhostButton className="w-full py-3" onClick={() => navigate('/demo')}>
            {tier.cta}
          </GhostButton>
        )}
      </div>
    </motion.div>
  );
}

/** Section 2 — three tier cards, MIRROR lifted. */
export default function TierCards({ annual }: { annual: boolean }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16">
      <div className="grid items-stretch gap-6 pt-3 md:grid-cols-3">
        {TIERS.map((tier, i) => (
          <TierCard key={tier.id} tier={tier} annual={annual} index={i} />
        ))}
      </div>
    </section>
  );
}
