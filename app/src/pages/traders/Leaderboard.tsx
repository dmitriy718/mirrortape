import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import Panel from '@/components/Panel';
import Sparkline from '@/components/Sparkline';
import CopyButton from '@/components/CopyButton';
import { GhostButton } from '@/components/Buttons';
import { useInView, usePrefersReducedMotion } from '@/hooks/useInView';
import { cn } from '@/lib/utils';
import { fmtNum, fmtSigned } from './data';
import type { Trader } from './data';

const HEADERS = [
  '#', 'TRADER', 'STRATEGY', 'INSTRUMENTS', '12M RETURN', '90D', 'WIN RATE',
  'MAX DD', 'AVG HOLD', 'FOLLOWERS', 'EQUITY 90D', '',
];

function DimChip({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-text-2">
      {children}
    </span>
  );
}

/** Solid mint COPYING state (trader already mirrored). */
function CopyingPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-mint bg-mint px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-bg">
      <BadgeCheck size={11} aria-hidden="true" />
      Copying
    </span>
  );
}

/**
 * Section 3 — verified leaderboard table. Rows cross-fade on filter change,
 * spring to new positions on sort, stagger in on first view and on load-more.
 */
export default function Leaderboard({
  rows,
  total,
  appendFrom,
  onSelect,
  onLoadMore,
  hasMore,
}: {
  rows: Trader[];
  total: number;
  /** index from which the last "load more" batch starts (for its 0.05s stagger) */
  appendFrom: number;
  onSelect: (t: Trader) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  // after the initial entrance sequence finishes, new rows animate without the 0.06s stagger
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (inView && !entered) {
      const t = setTimeout(() => setEntered(true), 1400);
      return () => clearTimeout(t);
    }
  }, [inView, entered]);

  const rowDelay = (i: number) => {
    if (reduced) return 0;
    if (!entered) return Math.min(i, 7) * 0.06; // initial 8-row stagger
    if (i >= appendFrom) return (i - appendFrom) * 0.05; // load-more stagger
    return 0; // filter/sort cross-fade
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-24 pt-6">
      <div ref={ref}>
        <Panel
          label="VERIFIED LEADERBOARD"
          actions={
            <span className="font-mono text-[10px] tracking-[0.08em] text-text-3">
              {rows.length} / {total} SHOWN
            </span>
          }
          bodyClassName="overflow-x-auto"
        >
          <table className="w-full min-w-[1080px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {HEADERS.map((h, i) => (
                  <th
                    key={`${h}-${i}`}
                    scope="col"
                    className={cn(
                      'px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3',
                      i >= 4 ? 'text-right' : 'text-left',
                      i === HEADERS.length - 1 && 'text-right',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false} mode="popLayout">
                {rows.map((t, i) => (
                  <motion.tr
                    key={t.handle}
                    layout={reduced ? false : 'position'}
                    initial={reduced ? false : { opacity: 0, y: entered ? 0 : 18 }}
                    animate={inView ? { opacity: 1, y: 0 } : reduced ? { opacity: 1 } : {}}
                    exit={{ opacity: 0 }}
                    transition={{
                      opacity: { duration: reduced ? 0 : 0.2, delay: rowDelay(i) },
                      y: { duration: reduced ? 0 : 0.5, delay: rowDelay(i), ease: [0.16, 1, 0.3, 1] },
                      layout: { type: 'spring', stiffness: 320, damping: 32, duration: 0.35 },
                    }}
                    onClick={() => onSelect(t)}
                    className="cursor-pointer border-b border-border/60 transition-colors duration-150 last:border-0 hover:bg-surface-3"
                  >
                    <td className="px-4 py-3 font-mono text-[13px] tabular-nums text-text-3">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={t.avatar} alt="" width={32} height={32} className="rounded" loading="lazy" />
                        <span className="flex flex-col">
                          <span className="flex items-center gap-1.5">
                            <span className="font-mono text-[13px] font-bold text-text-1">{t.handle}</span>
                            <BadgeCheck size={13} className="text-cyan" aria-label="Verified" />
                          </span>
                          <span className="font-mono text-[10px] text-text-3">{t.name}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><DimChip>{t.strategy}</DimChip></td>
                    <td className="px-4 py-3"><DimChip>{t.instrument}</DimChip></td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] font-bold tabular-nums text-mint">
                      {fmtSigned(t.ret12m)}%
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-mono text-[13px] tabular-nums',
                        t.ret90d >= 0 ? 'text-mint' : 'text-red',
                      )}
                    >
                      {fmtSigned(t.ret90d)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-text-2">
                      {t.win.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-red">
                      {t.dd.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-text-2">
                      {t.avgHold}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-text-2">
                      {fmtNum(t.followers)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Sparkline data={t.spark} width={96} height={28} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                        {t.copying ? <CopyingPill /> : <CopyButton />}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="border-t border-border px-4 py-12 text-center font-mono text-xs text-text-3">
              // no verified traders match that filter
            </div>
          )}
        </Panel>

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <GhostButton onClick={onLoadMore} className="px-6">
              Load more traders
            </GhostButton>
          </div>
        )}
      </div>
    </section>
  );
}
