import { Eye, KeyRound, Lock, UserX } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const CELLS = [
  {
    icon: Lock,
    title: 'No custody, ever',
    body: "Funds and positions live at your broker. MirrorTape's API keys are scoped trade-only — withdrawals are cryptographically impossible.",
  },
  {
    icon: KeyRound,
    title: 'Encryption',
    body: 'TLS 1.3 in transit, AES-256 at rest. Broker tokens stored in a dedicated secrets vault, never in our primary database.',
  },
  {
    icon: Eye,
    title: 'Full audit log',
    body: 'Every signal, gate decision, order, and rejection is logged with timestamps and visible in your terminal.',
  },
  {
    icon: UserX,
    title: 'Trader blindness',
    body: "Traders never see follower accounts, sizes, or capital. They're paid per subscriber — never a cut of your P/L.",
  },
];

/** Section 4 — 2×2 hairline-divided security model grid. */
export default function SecurityGrid() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <SectionHeader label="SECURITY MODEL" title="Built so we can't touch your money." />
      <div
        ref={ref}
        className="grid overflow-hidden rounded-[10px] border border-border bg-surface-1 md:grid-cols-2"
      >
        {CELLS.map((c, i) => (
          <div
            key={c.title}
            className={cn(
              'group border-border p-8 transition-colors duration-150',
              'max-md:[&:not(:last-child)]:border-b',
              'md:[&:nth-child(odd)]:border-r md:[&:nth-child(-n+2)]:border-b',
              'hover:bg-surface-2',
              inView && 'reveal',
            )}
            style={{ ['--reveal-delay' as string]: `${i * 0.1}s`, ['--reveal-y' as string]: '28px' }}
          >
            <c.icon
              size={22}
              strokeWidth={1.75}
              className="text-text-2 transition-colors duration-150 group-hover:text-cyan"
            />
            <h4 className="mt-3 font-mono text-[13px] font-bold uppercase tracking-[0.08em] text-text-1">
              {c.title}
            </h4>
            <p className="mt-2 max-w-[440px] font-sans text-sm leading-relaxed text-text-2">
              {c.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
