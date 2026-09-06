import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import LiveDot from '@/components/LiveDot';
import DeltaChip from '@/components/DeltaChip';
import Sparkline from '@/components/Sparkline';
import CandlestickChart from '@/components/CandlestickChart';
import { PrimaryButton, GhostButton } from '@/components/Buttons';
import { useSimulatedMarket } from '@/hooks/useSimulatedMarket';
import { usePrefersReducedMotion } from '@/hooks/useInView';
import { market, type MirrorEvent } from '@/lib/marketEngine';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const WATCHLIST = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMD', 'META', 'JPM', 'AMZN'];
const TIMEFRAMES = ['1m', '5m', '15m', '1H', '1D'];
const EYEBROW = '[ COPY TRADING · STOCKS + OPTIONS ]';

function WatchlistRow({
  symbol,
  active,
  onClick,
}: {
  symbol: string;
  active: boolean;
  onClick: () => void;
}) {
  const m = useSimulatedMarket();
  const s = m.get(symbol);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left transition-colors duration-150',
        active ? 'bg-cyan-dim' : 'hover:bg-surface-3',
      )}
    >
      {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-cyan" aria-hidden="true" />}
      <span className="flex flex-col gap-0.5">
        <span className="font-mono text-[13px] font-bold text-text-1">{s.symbol}</span>
        <span
          key={s.tickId}
          className={cn(
            'font-mono text-xs tabular-nums text-text-2',
            s.tickDir !== 0 && (s.tickDir > 0 ? 'flash-mint' : 'flash-red'),
          )}
        >
          {s.price.toFixed(2)}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <DeltaChip value={s.deltaPct} />
        <Sparkline data={s.spark} width={64} height={20} />
      </span>
    </button>
  );
}

function MirrorFeed() {
  const [events, setEvents] = useState<MirrorEvent[]>(() => Array.from({ length: 5 }, () => market.randomFeedEvent()).reverse());
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // seed initial rows
    return market.subscribeFeed((e) => {
      setEvents((prev) => [e, ...prev].slice(0, 8));
    });
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
        <LiveDot variant="cyan" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Mirror Feed
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        {events.map((e) => (
          <div
            key={e.id}
            className={cn(
              'border-b border-border/60 px-3 py-2',
              !reduced && 'reveal',
            )}
            style={{
              borderLeft: `2px solid ${e.side === 'buy' ? 'var(--mint)' : 'var(--red)'}`,
              ['--reveal-y' as string]: '-10px',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-semibold text-cyan">{e.trader}</span>
              <span className="font-mono text-[10px] tabular-nums text-text-3">{e.time}</span>
            </div>
            <div className="mt-0.5 font-mono text-[11px] leading-snug text-text-2">{e.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroDashboard({
  symbol,
  setSymbol,
}: {
  symbol: string;
  setSymbol: (s: string) => void;
}) {
  const [tf, setTf] = useState('1m');
  const m = useSimulatedMarket();
  const s = m.get(symbol);

  return (
    <div
      id="hero-dashboard"
      className="overflow-hidden rounded-[10px] border border-border bg-surface-1 shadow-cyan-glow"
    >
      {/* browser chrome */}
      <div className="flex h-10 items-center gap-3 border-b border-border bg-surface-2 px-4">
        <span className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-surface-3" />
          <i className="h-2.5 w-2.5 rounded-full bg-surface-3" />
          <i className="h-2.5 w-2.5 rounded-full bg-surface-3" />
        </span>
        <span className="font-mono text-[11px] text-text-3">app.mirrortape.io/demo</span>
        <span className="ml-auto rounded bg-[rgba(251,191,36,0.1)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber">
          Simulated Data
        </span>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr_300px]">
        {/* watchlist rail */}
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex h-10 items-center border-b border-border px-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
              Watchlist
            </span>
          </div>
          <div className="max-h-[220px] divide-y divide-border/60 overflow-y-auto lg:max-h-none lg:overflow-visible">
            {WATCHLIST.map((sym) => (
              <WatchlistRow key={sym} symbol={sym} active={sym === symbol} onClick={() => setSymbol(sym)} />
            ))}
          </div>
        </div>

        {/* chart zone */}
        <div className="min-w-0">
          <div className="flex h-12 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4">
            <span className="font-mono text-xl font-semibold text-text-1">{s.symbol}</span>
            <span
              key={s.tickId}
              className={cn(
                'font-mono text-sm tabular-nums text-text-2',
                s.tickDir !== 0 && (s.tickDir > 0 ? 'flash-mint' : 'flash-red'),
              )}
            >
              {s.price.toFixed(2)}
            </span>
            <DeltaChip value={s.deltaPct} />
            <div className="ml-auto flex items-center gap-1">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTf(t)}
                  className={cn(
                    'relative cursor-pointer px-2 py-1 font-mono text-[11px] font-semibold transition-colors duration-150',
                    tf === t ? 'text-cyan' : 'text-text-3 hover:text-text-1',
                  )}
                >
                  {t}
                  {tf === t && (
                    <span className="absolute inset-x-1 bottom-0 h-0.5 bg-cyan" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2">
            <CandlestickChart symbol={symbol} timeframe={tf} height={340} />
          </div>
        </div>

        {/* copy feed rail */}
        <div className="border-t border-border lg:border-l lg:border-t-0">
          <MirrorFeed />
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState('AAPL');
  const [typed, setTyped] = useState(0);
  const reduced = usePrefersReducedMotion();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // eyebrow type-in (18ms per character)
  useEffect(() => {
    if (reduced) {
      setTyped(EYEBROW.length);
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(i);
      if (i >= EYEBROW.length) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [reduced]);

  // ticker tape → symbol selection
  useEffect(() => {
    const fn = (e: Event) => setSymbol((e as CustomEvent<string>).detail);
    window.addEventListener('mirrortape:symbol', fn);
    return () => window.removeEventListener('mirrortape:symbol', fn);
  }, []);

  // dashboard panel entrance tilt + scroll parallax
  useGSAP(
    () => {
      if (reduced || !panelRef.current) return;
      gsap.fromTo(
        panelRef.current,
        { rotateX: 12, y: 80, opacity: 0, transformPerspective: 1200 },
        { rotateX: 0, y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', delay: 0.3 },
      );
      gsap.to(panelRef.current, {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    },
    { dependencies: [reduced] },
  );

  const scrollToDashboard = () => {
    document.getElementById('hero-dashboard')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  };

  const h1Words = (line: string, base: number) =>
    line.split(' ').map((w, i) => (
      <span
        key={`${w}-${i}`}
        className="reveal inline-block"
        style={{ ['--reveal-delay' as string]: `${base + i * 0.09}s`, ['--reveal-y' as string]: '30px' }}
      >
        {w}&nbsp;
      </span>
    ));

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ minHeight: 'max(860px, 100dvh)' }}
    >
      {/* backdrop: tiled grid + radial cyan glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'url(/grid-texture.png)', backgroundRepeat: 'repeat' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(60% 50% at 50% 0%, rgba(34,211,238,0.07), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1280px] px-6 pb-20 pt-16">
        {/* copy block */}
        <div className="mx-auto mb-12 max-w-[900px] text-center">
          <div className="mb-5 h-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
            {EYEBROW.slice(0, typed)}
            {typed < EYEBROW.length && <span className="cursor-blink">▍</span>}
          </div>
          <h1 className="font-sans text-[60px] font-extrabold leading-[1.04] tracking-[-0.03em] text-text-1 max-md:text-4xl">
            {h1Words('Trade the tape.', 0.1)}
            <br />
            <span className="text-cyan">{h1Words('Mirror', 0.28)}</span>
            {h1Words('the best.', 0.37)}
            <span className="cursor-blink ml-1 inline-block h-[0.85em] w-[0.32em] translate-y-[0.08em] bg-cyan" aria-hidden="true" />
          </h1>
          <p
            className="reveal mx-auto mt-6 max-w-[620px] font-sans text-[17px] leading-[1.65] text-text-2"
            style={{ ['--reveal-delay' as string]: '0.55s' }}
          >
            MirrorTape copies the stock and options trades of verified top performers into your own
            brokerage account — in milliseconds, with your risk limits enforced on every order.
          </p>
          <div
            className="reveal mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ ['--reveal-delay' as string]: '0.75s' }}
          >
            <PrimaryButton onClick={() => navigate('/pricing')}>▸ Start Mirroring</PrimaryButton>
            <GhostButton onClick={scrollToDashboard}>Watch the live demo ↓</GhostButton>
          </div>
          <p
            className="reveal mt-6 font-mono text-[10px] tracking-[0.02em] text-text-3"
            style={{ ['--reveal-delay' as string]: '0.9s' }}
          >
            Options involve risk and are not suitable for all investors. Past performance does not
            guarantee future results.
          </p>
        </div>

        {/* embedded dashboard panel */}
        <div ref={panelRef} className="mx-auto max-w-[1180px]">
          <HeroDashboard symbol={symbol} setSymbol={setSymbol} />
        </div>
      </div>
    </section>
  );
}
