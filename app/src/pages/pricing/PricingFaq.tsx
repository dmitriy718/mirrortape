import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import FaqAccordion from '@/components/FaqAccordion';
import SectionHeader from '@/components/SectionHeader';
import { MINI_FAQ } from '@/pages/pricing/data';
import { EASE_OUT_EXPO } from '@/pages/pricing/reveal';

/** Section 5 — pricing mini-FAQ (4 items) + link to full /faq. */
export default function PricingFaq() {
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto max-w-[840px] px-6 pt-28">
      <SectionHeader label="PRICING FAQ" title="Before you ask." center />
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_EXPO }}
      >
        <FaqAccordion items={MINI_FAQ} />
        <div className="mt-6 text-center">
          <Link
            to="/faq"
            className="font-mono text-xs font-semibold tracking-[0.06em] text-cyan transition-colors duration-150 hover:brightness-125"
          >
            All questions →
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
