import { Check } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';
import Sparkline from '@/components/Sparkline';
import CopyButton from '@/components/CopyButton';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

export const TRADER_ROWS = [
  { handle: '@delta_hunter', avatar: '/avatar-01.png', ret: 214.6, win: 71.2, dd: -11.4, followers: '18,204', equity: [10, 12, 11, 14, 16, 15, 19, 22, 21, 26] },
  { handle: '@iron_condor_kate', avatar: '/avatar-02.png', ret: 162.3, win: 78.9, dd: -6.8, followers: '12,847', equity: [10, 11, 12, 12.5, 13, 14, 14.5, 15.5, 16, 17] },
  { handle: '@tape_reader', avatar: '/avatar-03.png', ret: 141.8, win: 66.4, dd: -14.2, followers: '9,312', equity: [12, 10, 13, 12, 14, 13, 16, 15, 18, 19] },
  { handle: '@gamma_flow', avatar: '/avatar-04.png', ret: 118.5, win: 69.1, dd: -9.7, followers: '7,556', equity: [10, 11.5, 11, 12.5, 13, 12.5, 14, 15, 16, 16.5] },
  { handle: '@value_velocity', avatar: '/avatar-05.png', ret: 96.2, win: 74.3, dd: -5.9, followers: '6,120', equity: [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5] },
  { handle: '@swing_sheriff', avatar: '/avatar-06.png', ret: 88.7, win: 63.8, dd: -12.6, followers: '4,983', equity: [11, 10, 12, 11.5, 13, 12.5, 14, 13.5, 15, 15.5] },
];

/** Section 5 — trader leaderboard preview table (6 rows). */
export default function LeaderboardPreview() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <SectionHeader
        label="LEADERBOARD"
        title="Follow traders with receipts."
        linkText="View all 1,208 traders"
        linkTo="/traders"
      />
      <div
        ref={ref}
        className="overflow-x-auto rounded-[10px] border border-border bg-surface-1"
      >
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {['#', 'Trader', '12M Return', 'Win Rate', 'Max DD', 'Followers', 'Equity 90D', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRADER_ROWS.map((t, i) => (
              <tr
                key={t.handle}
                className={cn(
                  'border-b border-border/60 transition-colors duration-150 last:border-0 hover:bg-surface-3',
                  inView && 'reveal',
                )}
                style={{ ['--reveal-delay' as string]: `${i * 0.08}s`, ['--reveal-y' as string]: '20px' }}
              >
                <td className="px-4 py-3 font-mono text-[13px] tabular-nums text-text-3">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <img src={t.avatar} alt="" width={32} height={32} className="rounded" loading="lazy" />
                    <span className="font-mono text-[13px] font-semibold text-text-1">{t.handle}</span>
                    <Check size={13} className="text-cyan" aria-label="Verified" />
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] font-bold tabular-nums text-mint">
                  +{t.ret.toFixed(1)}%
                </td>
                <td className="px-4 py-3 font-mono text-[13px] tabular-nums text-text-2">
                  {t.win.toFixed(1)}%
                </td>
                <td className="px-4 py-3 font-mono text-[13px] tabular-nums text-red">
                  {t.dd.toFixed(1)}%
                </td>
                <td className="px-4 py-3 font-mono text-[13px] tabular-nums text-text-2">{t.followers}</td>
                <td className="px-4 py-3">
                  <Sparkline data={t.equity} width={96} height={28} />
                </td>
                <td className="px-4 py-3 text-right">
                  <CopyButton />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
