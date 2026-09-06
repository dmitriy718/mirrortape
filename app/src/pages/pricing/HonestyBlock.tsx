import { motion, useReducedMotion } from 'framer-motion';
import { FINE_PRINT } from '@/pages/pricing/data';
import { EASE_OUT_EXPO } from '@/pages/pricing/reveal';

/** Section 4 — cost honesty block: amber "fine print in large type". */
export default function HonestyBlock() {
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto max-w-[840px] px-6 pt-28">
      <motion.div
        initial={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_EXPO }}
        className="rounded-[10px] border border-amber/40 bg-surface-1 p-8 max-md:p-6"
      >
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: [0, 1, 0.4, 1] }}
          viewport={{ once: true, amount: 0.2 }}
          transition={
            reduced
              ? { duration: 0.01 }
              : { duration: 1.2, times: [0, 0.4, 0.7, 1], delay: 0.2 }
          }
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amber"
        >
          [ The fine print, in large type ]
        </motion.div>
        <p className="mt-4 font-sans text-[15px] leading-relaxed text-text-2">{FINE_PRINT}</p>
      </motion.div>
    </section>
  );
}
