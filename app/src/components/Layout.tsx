import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Lenis from 'lenis';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TickerTape from '@/components/TickerTape';
import { usePrefersReducedMotion } from '@/hooks/useInView';

/**
 * Global chrome for marketing pages. Renders <Outlet/> — App.tsx must nest
 * routes under <Route element={<Layout/>}>. Owns the top offset that keeps
 * every page below the fixed navbar (and the fixed ticker tape on `/`).
 */
export default function Layout() {
  const { pathname } = useLocation();
  const reduced = usePrefersReducedMotion();
  const showTape = pathname === '/';
  const topOffset = showTape ? 40 : 0;

  // Lenis smooth scrolling on marketing pages (dashboard demo uses native scroll)
  useEffect(() => {
    if (reduced || pathname === '/demo') return;
    const lenis = new Lenis({ lerp: 0.1, duration: 1.1 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reduced, pathname]);

  // reset scroll on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] bg-bg text-text-1">
      {showTape && <TickerTape className="tape-enter fixed inset-x-0 top-0 z-[60]" />}
      <Navbar topOffset={topOffset} />
      <main style={{ paddingTop: topOffset + 64 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
