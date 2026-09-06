import { useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { GhostButton, PrimaryButton } from '@/components/Buttons';
import { EASE_OUT_EXPO, WordReveal } from '@/pages/pricing/reveal';

/** Section 6 — final CTA band. Global footer is rendered by Layout. */
export default function PricingCta() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  return (
    <section className="relative mt-28 overflow-hidden border-t border-border">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(34,211,238,0.06), transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[900px] px-6 py-28 text-center">
        <WordReveal
          as="h2"
          trigger="inView"
          text="Start free. Upgrade when the tape convinces you."
          className="mx-auto max-w-[720px] font-sans text-4xl font-bold tracking-[-0.02em] text-text-1 max-md:text-3xl"
        />
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_EXPO, delay: 0.2 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton className="px-8 py-3.5" onClick={() => navigate('/demo')}>
            Start paper trading
          </PrimaryButton>
          <GhostButton className="px-8 py-3.5" onClick={() => navigate('/demo')}>
            See the demo
          </GhostButton>
        </motion.div>
      </div>
    </section>
  );
}
