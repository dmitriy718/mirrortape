import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import SectionHeader from '@/components/SectionHeader';
import StatBlock from '@/components/StatBlock';
import { PrimaryButton, GhostButton } from '@/components/Buttons';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const TIERS = [
  {
    name: 'PAPER',
    price: 0,
    format: (v: number) => `$${Math.round(v)}`,
    features: ['Simulated mirroring', 'Full dashboard', '3 watch traders'],
    cta: 'Start free',
    primary: false,
  },
  {
    name: 'MIRROR',
    price: 49,
    format: (v: number) => `$${Math.round(v)}/mo`,
    features: ['Live mirroring', '5 traders', 'Full risk engine'],
    cta: 'Start Mirroring',
    primary: true,
  },
  {
    name: 'MIRROR PRO',
    price: 129,
    format: (v: number) => `$${Math.round(v)}/mo`,
    features: ['Unlimited traders', 'Options flow feed', 'API + webhooks'],
    cta: 'Start Mirroring',
    primary: false,
  },
];

/** Section 9 — three-tier pricing teaser. */
export default function PricingTeaser() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-24">
      <SectionHeader label="PRICING" title="Pay for signal, not hype." />
      <div
        ref={ref}
        className="grid overflow-hidden rounded-[10px] border border-border bg-surface-1 md:grid-cols-3 md:divide-x md:divide-border"
      >
        {TIERS.map((t, i) => (
          <div
            key={t.name}
            className={cn(
              'relative flex flex-col gap-5 border-b border-border p-8 last:border-b-0 md:border-b-0',
              t.primary && 'shadow-[inset_0_1px_0_0_var(--cyan)]',
              inView && 'reveal',
            )}
            style={{ ['--reveal-delay' as string]: `${i * 0.12}s`, ['--reveal-y' as string]: '32px' }}
          >
            {t.primary && (
              <span className="absolute right-4 top-4 rounded bg-cyan-dim px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-cyan">
                Most Popular
              </span>
            )}
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-text-2">
              {t.name}
            </span>
            <StatBlock label="" value={t.price} format={t.format} caret={false} />
            <ul className="space-y-2">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2 font-mono text-xs text-text-2">
                  <span className="text-mint">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              {t.primary ? (
                <PrimaryButton className="w-full" onClick={() => navigate('/pricing')}>
                  {t.cta}
                </PrimaryButton>
              ) : (
                <GhostButton className="w-full" onClick={() => navigate('/pricing')}>
                  {t.cta}
                </GhostButton>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-right">
        <Link
          to="/pricing"
          className="font-mono text-xs font-semibold tracking-[0.06em] text-cyan hover:brightness-125"
        >
          Full comparison →
        </Link>
      </div>
    </section>
  );
}
