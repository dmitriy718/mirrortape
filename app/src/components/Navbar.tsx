import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Menu, X } from 'lucide-react';
import LiveDot from '@/components/LiveDot';
import { PrimaryButton } from '@/components/Buttons';
import { getMarketStatus } from '@/lib/marketHours';
import { cn } from '@/lib/utils';

export const NAV_LINKS = [
  { label: 'Live Demo', to: '/demo' },
  { label: 'Traders', to: '/traders' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'FAQ', to: '/faq' },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      <span
        className="cursor-blink inline-block h-[14px] w-2 bg-cyan"
        aria-hidden="true"
      />
      <span className="font-mono text-[15px] font-bold tracking-[0.04em]">
        <span className="text-text-1">MIRROR</span>
        <span className="text-cyan">TAPE</span>
      </span>
    </span>
  );
}

export function MarketStatusPill({ className }: { className?: string }) {
  const [status, setStatus] = useState(getMarketStatus);
  useEffect(() => {
    const t = setInterval(() => setStatus(getMarketStatus()), 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span
      className={cn(
        'hidden items-center gap-1.5 rounded border border-border px-2 py-1 lg:inline-flex',
        className,
      )}
    >
      <LiveDot variant={status.open ? 'cyan' : 'amber'} />
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-2">
        {status.label}
      </span>
    </span>
  );
}

/** Fixed terminal navbar: 64px → 52px after 40px scroll, blur + bottom hairline. */
export default function Navbar({ topOffset = 0 }: { topOffset?: number }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer]);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 z-50 border-b border-border bg-bg/80 backdrop-blur-[12px]',
          'transition-[height] duration-300 ease-out-expo',
          scrolled ? 'h-[52px]' : 'h-16',
        )}
        style={{ top: topOffset }}
      >
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-6 px-6">
          <Link to="/" aria-label="MirrorTape home" className="shrink-0">
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'group relative py-1 font-mono text-xs font-semibold uppercase tracking-[0.08em]',
                    'transition-colors duration-150 hover:text-cyan',
                    isActive ? 'text-cyan' : 'text-text-2',
                  )
                }
              >
                {l.label}
                <span
                  className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-cyan transition-transform duration-200 ease-out-expo group-hover:scale-x-100"
                  aria-hidden="true"
                />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <MarketStatusPill />
            <button
              type="button"
              onClick={() => navigate('/demo')}
              className="hidden cursor-pointer rounded-md px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-text-1 transition-colors duration-150 hover:text-cyan sm:block"
            >
              Log in
            </button>
            <PrimaryButton className="hidden px-4 py-2 sm:inline-flex" onClick={() => navigate('/pricing')}>
              Start Mirroring
            </PrimaryButton>
            <button
              type="button"
              className="cursor-pointer p-2 text-text-1 md:hidden"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-bg md:hidden">
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <Wordmark />
            <button
              type="button"
              className="cursor-pointer p-2 text-text-1"
              onClick={() => setDrawer(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-6 py-8" aria-label="Mobile">
            {NAV_LINKS.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setDrawer(false)}
                className="border-b border-border py-4 font-mono text-base font-semibold uppercase tracking-[0.08em] text-text-1 transition-colors hover:text-cyan"
                style={{ animation: `drawer-in 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s both` }}
              >
                {l.label}
              </Link>
            ))}
            <style>{`@keyframes drawer-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }`}</style>
            <PrimaryButton
              className="mt-6"
              onClick={() => {
                setDrawer(false);
                navigate('/pricing');
              }}
            >
              ▸ Start Mirroring
            </PrimaryButton>
          </nav>
        </div>
      )}
    </>
  );
}
