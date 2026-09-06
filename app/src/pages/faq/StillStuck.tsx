import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Panel from '@/components/Panel';
import { EASE_OUT_EXPO } from '@/pages/pricing/reveal';

/** Section 3 — "Still stuck?" support band. */
export default function StillStuck() {
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto max-w-[840px] px-6 py-24">
      <motion.div
        initial={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_EXPO }}
      >
        <Panel label="Support" bodyClassName="p-6">
          <h3 className="font-sans text-xl font-semibold tracking-[-0.01em] text-text-1">
            Still stuck?
          </h3>
          <p className="mt-1.5 font-sans text-sm text-text-2">Real humans, market hours, fast.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <motion.a
              href="mailto:support@mirrortape.io"
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduced ? 0.01 : 0.4, ease: EASE_OUT_EXPO, delay: 0.1 }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2.5 font-mono text-xs font-semibold tracking-[0.06em] text-text-1 transition-colors duration-150 hover:border-cyan hover:text-cyan"
            >
              <Mail size={14} aria-hidden="true" />
              support@mirrortape.io
            </motion.a>
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduced ? 0.01 : 0.4, ease: EASE_OUT_EXPO, delay: 0.2 }}
            >
              <Link
                to="/risk"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2.5 font-mono text-xs font-semibold tracking-[0.06em] text-text-1 transition-colors duration-150 hover:border-cyan hover:text-cyan"
              >
                Read the risk disclosures →
              </Link>
            </motion.div>
          </div>
        </Panel>
      </motion.div>
    </section>
  );
}
