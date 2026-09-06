import { motion, useReducedMotion } from 'framer-motion';
import SectionHeader from '@/components/SectionHeader';
import { MATRIX, type MatrixCell } from '@/pages/pricing/data';
import { EASE_OUT_EXPO } from '@/pages/pricing/reveal';
import { cn } from '@/lib/utils';

function Cell({ value, cyan = false }: { value: MatrixCell; cyan?: boolean }) {
  if (value === 'check') {
    return <span className="font-mono text-sm font-bold text-mint">✓</span>;
  }
  if (value === 'cross') {
    return <span className="font-mono text-sm text-text-3">✕</span>;
  }
  if (value === 'dash') {
    return <span className="font-mono text-sm text-text-3">—</span>;
  }
  return (
    <span className={cn('font-mono text-[13px] font-medium', cyan ? 'text-cyan' : 'text-text-1')}>
      {value}
    </span>
  );
}

/** Section 3 — grouped feature matrix table (max 1080px, hairline). */
export default function FeatureMatrix() {
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto max-w-[1080px] px-6 pt-28">
      <SectionHeader label="COMPARE" title="Every feature, side by side." center />
      <div className="overflow-x-auto rounded-[10px] border border-border bg-surface-1">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
                Feature
              </th>
              <th className="px-5 py-3.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
                Paper
              </th>
              <th className="px-5 py-3.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-2">
                Mirror
              </th>
              <th className="px-5 py-3.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan">
                Pro
              </th>
            </tr>
          </thead>
          {MATRIX.map((group, gi) => (
            <tbody key={group.label}>
              <motion.tr
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: reduced ? 0.01 : 0.4, delay: gi * 0.1 }}
                className="border-b border-border"
              >
                <td
                  colSpan={4}
                  className="bg-surface-2/50 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan"
                >
                  [ {group.label} ]
                </td>
              </motion.tr>
              {group.rows.map((row, ri) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: reduced ? 0.01 : 0.4,
                    ease: EASE_OUT_EXPO,
                    delay: gi * 0.1 + ri * 0.04,
                  }}
                  className="border-b border-border/60 transition-colors duration-150 last:border-b-0 hover:bg-surface-3"
                >
                  <td className="px-5 py-3.5 font-sans text-sm text-text-1">{row.feature}</td>
                  {row.cells.map((cell, ci) => (
                    <td key={ci} className="px-5 py-3.5 text-center">
                      <Cell value={cell} cyan={ci === 2} />
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
