import SectionHeader from '@/components/SectionHeader';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const ROWS: Array<{ cap: string; diy: string; mt: string }> = [
  { cap: "Reaction time to a pro's trade", diy: 'hours—if you notice', mt: '~38ms ✓' },
  { cap: 'Verified performance data', diy: '✕ screenshots & hype', mt: '✓ audited from real fills' },
  { cap: 'Options execution discipline', diy: '✕ emotional entries', mt: '✓ rules enforced per order' },
  { cap: 'Risk limits', diy: '— willpower', mt: '✓ hard-coded caps + kill switch' },
  { cap: 'Watching the tape all day', diy: '✕', mt: '✓ optional' },
];

/** Section 8 — MirrorTape vs. doing it yourself. */
export default function Comparison() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  return (
    <section className="mx-auto max-w-[980px] px-6 py-24">
      <SectionHeader label="VS." title="MirrorTape vs. doing it yourself." center />
      <div ref={ref} className="overflow-hidden rounded-[10px] border border-border bg-surface-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
                Capability
              </th>
              <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
                Doing It Yourself
              </th>
              <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan">
                MirrorTape
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr
                key={r.cap}
                className={cn('border-b border-border/60 last:border-0', inView && 'reveal')}
                style={{ ['--reveal-delay' as string]: `${i * 0.07}s`, ['--reveal-y' as string]: '12px' }}
              >
                <td className="px-5 py-3.5 font-mono text-[13px] text-text-1">{r.cap}</td>
                <td className="px-5 py-3.5 font-mono text-[13px] text-text-3">{r.diy}</td>
                <td className="px-5 py-3.5 font-mono text-[13px] font-semibold text-mint">{r.mt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
