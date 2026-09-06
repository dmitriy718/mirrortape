import { useNavigate } from 'react-router';
import { PrimaryButton } from '@/components/Buttons';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

/** Section 11 — final CTA band with breathing cyan glow + grid texture. */
export default function FinalCta() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-t border-border">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'url(/grid-texture.png)', backgroundRepeat: 'repeat' }}
        aria-hidden="true"
      />
      <div
        className="glow-breathe pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(50% 60% at 50% 100%, rgba(34,211,238,0.09), transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div ref={ref} className="relative mx-auto max-w-[900px] px-6 py-28 text-center">
        <h2 className="font-sans text-4xl font-bold tracking-[-0.02em] text-text-1 max-md:text-3xl">
          {'Stop watching. Start mirroring.'.split(' ').map((w, i) => (
            <span
              key={i}
              className={cn('inline-block', inView && 'reveal')}
              style={{ ['--reveal-delay' as string]: `${i * 0.08}s`, ['--reveal-y' as string]: '24px' }}
            >
              {w}&nbsp;
            </span>
          ))}
        </h2>
        <div
          className={cn('mt-8', inView && 'reveal')}
          style={{ ['--reveal-delay' as string]: '0.45s' }}
        >
          <PrimaryButton className="px-8 py-3.5" onClick={() => navigate('/pricing')}>
            ▸ Start Mirroring
          </PrimaryButton>
        </div>
        <p
          className={cn('mt-6 font-mono text-[10px] tracking-[0.02em] text-text-3', inView && 'reveal')}
          style={{ ['--reveal-delay' as string]: '0.6s' }}
        >
          Options involve risk and are not suitable for all investors. Past performance does not
          guarantee future results.
        </p>
      </div>
    </section>
  );
}
