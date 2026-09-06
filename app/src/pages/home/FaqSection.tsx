import { Link } from 'react-router';
import SectionHeader from '@/components/SectionHeader';
import FaqAccordion from '@/components/FaqAccordion';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const ITEMS = [
  {
    q: 'Is MirrorTape a broker?',
    a: "No. We're a technology layer. Your account, your custody, your broker executes — MirrorTape relays signals and enforces your limits.",
  },
  {
    q: 'Do I need options approval?',
    a: 'Yes. For mirrored options trades you need the matching approval level at your broker. Equity-only mirroring works without it.',
  },
  {
    q: 'How are traders verified?',
    a: 'Every leaderboard trader passes 12+ months of audited brokerage fills, a minimum of 200 trades, and a full drawdown review before listing.',
  },
  {
    q: 'What does mirroring cost beyond subscription?',
    a: "No per-trade markup from us. Your broker's normal commissions and fees apply to mirrored executions.",
  },
  {
    q: 'Can I stop copying instantly?',
    a: 'One tap halts new signals. Optional auto-flatten closes copied positions per your preset.',
  },
  {
    q: 'Is past performance real?',
    a: 'All leaderboard stats come from verified fills. Still, past performance does not guarantee future results.',
  },
];

/** Section 10 — FAQ accordion (6 items). */
export default function FaqSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <section className="mx-auto max-w-[840px] px-6 py-24">
      <SectionHeader label="FAQ" title="Straight answers." center />
      <div ref={ref} className={cn(inView && 'reveal')} style={{ ['--reveal-y' as string]: '16px' }}>
        <FaqAccordion items={ITEMS} />
        <div className="mt-6 text-center">
          <Link
            to="/faq"
            className="font-mono text-xs font-semibold tracking-[0.06em] text-cyan hover:brightness-125"
          >
            All 24 questions →
          </Link>
        </div>
      </div>
    </section>
  );
}
