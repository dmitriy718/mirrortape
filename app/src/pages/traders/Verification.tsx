import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Panel from '@/components/Panel';
import { GhostButton } from '@/components/Buttons';
import { useInView, usePrefersReducedMotion } from '@/hooks/useInView';

const CHECKLIST = [
  'Brokerage statements connected read-only',
  '12+ months of continuous trading history',
  'Minimum 200 verified fills audited',
  'Drawdown & consistency review passed',
  'Quarterly re-audit — delisted on failure',
];

/** Section 5 — verification explainer + numbered checklist + CTA band. */
export default function Verification() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const reduced = usePrefersReducedMotion();

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-28" ref={ref}>
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div>
          <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
            [ HOW VERIFICATION WORKS ]
          </div>
          <h3 className="font-sans text-2xl font-semibold tracking-[-0.01em] text-text-1">
            Receipts, or you don&apos;t list.
          </h3>
          <p className="mt-4 max-w-[520px] font-sans text-[15px] leading-[1.65] text-text-2">
            Connected brokerage statements → 12+ month history → minimum 200 fills → drawdown &amp;
            consistency review → quarterly re-audit. Traders never see follower capital and are paid
            per subscriber, not on your P/L.
          </p>
        </div>

        <Panel label="VERIFICATION CHECKLIST">
          <ul>
            {CHECKLIST.map((item, i) => (
              <motion.li
                key={item}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: reduced ? 0 : 0.4,
                  delay: reduced ? 0 : i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0"
              >
                <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums text-text-3">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 font-mono text-[13px] text-text-1">{item}</span>
                <motion.span
                  initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : {}}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 500, damping: 22, delay: i * 0.1 + 0.15 }
                  }
                  className="text-mint"
                  aria-hidden="true"
                >
                  <Check size={15} strokeWidth={2.5} />
                </motion.span>
              </motion.li>
            ))}
          </ul>
        </Panel>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mt-16 flex flex-col items-center gap-5 border-t border-border pt-16 text-center"
      >
        <h3 className="font-sans text-2xl font-semibold tracking-[-0.01em] text-text-1">
          Think you qualify?
        </h3>
        <GhostButton className="px-6">Apply as a trader</GhostButton>
      </motion.div>
    </section>
  );
}
