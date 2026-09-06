import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

const DISCLOSURE =
  'Options involve risk and are not suitable for all investors. Prior to trading options, you should read Characteristics and Risks of Standardized Options (ODD). Copy trading does not guarantee profits and may result in losses exceeding those of the trader you follow due to timing, slippage, and sizing differences. Past performance — including verified, audited performance — does not guarantee future results. MirrorTape Technologies, Inc. is a technology platform, not a broker-dealer, investment advisor, or exchange. All securities trading occurs in your own brokerage account under your agreement with your broker. Simulated data shown in demos is hypothetical and does not represent actual trading.';

/** Section 6 — risk disclosure wall. Restrained motion by design. */
export default function DisclosureWall() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  return (
    <section className="mx-auto max-w-[840px] px-6 py-24">
      <div
        ref={ref}
        className={cn(
          'rounded-[10px] border border-border bg-surface-1 p-6 transition-[opacity,transform] duration-500 ease-out-expo md:p-8',
          inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        )}
      >
        <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3">
          Risk Disclosure
        </div>
        <p className="font-mono text-[11px] leading-[1.8] tracking-[0.02em] text-text-2">
          {DISCLOSURE}
        </p>
      </div>
    </section>
  );
}
