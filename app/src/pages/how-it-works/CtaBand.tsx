import { useNavigate } from 'react-router';
import { GhostButton, PrimaryButton } from '@/components/Buttons';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

/** Section 7 — closing CTA band. */
export default function CtaBand() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div
        className="glow-breathe pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(50% 60% at 50% 100%, rgba(34,211,238,0.09), transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div ref={ref} className="relative mx-auto max-w-[900px] px-6 py-28 text-center">
        <h2 className="font-sans text-4xl font-bold tracking-[-0.02em] text-text-1 max-md:text-3xl">
          {'Ready to mirror?'.split(' ').map((w, i) => (
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
          className={cn('mt-8 flex flex-wrap items-center justify-center gap-3', inView && 'reveal')}
          style={{ ['--reveal-delay' as string]: '0.45s' }}
        >
          <PrimaryButton className="px-8 py-3.5" onClick={() => navigate('/pricing')}>
            ▸ Start Mirroring
          </PrimaryButton>
          <GhostButton className="px-8 py-3.5" onClick={() => navigate('/demo')}>
            Try the live demo
          </GhostButton>
        </div>
      </div>
    </section>
  );
}
