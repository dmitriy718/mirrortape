/**
 * MirrorTape simulated market engine.
 * A single module-level store feeding the ticker tape, watchlist, candle
 * charts and mirror feed so numbers stay internally consistent across zones.
 * All data is hypothetical/simulated.
 */

export interface SymbolState {
  symbol: string;
  price: number;
  prevPrice: number;
  baseDeltaPct: number; // delta vs prior close at boot
  deltaPct: number;
  spark: number[]; // 24 points
  tickDir: 1 | -1 | 0;
  tickId: number;
}

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface MirrorEvent {
  id: number;
  time: string;
  trader: string;
  action: string;
  side: 'buy' | 'sell';
}

export const TAPE_SYMBOLS: Array<{ symbol: string; price: number; delta: number }> = [
  { symbol: 'SPY', price: 597.42, delta: 0.84 },
  { symbol: 'QQQ', price: 521.18, delta: 1.12 },
  { symbol: 'AAPL', price: 238.42, delta: 1.24 },
  { symbol: 'MSFT', price: 428.9, delta: 0.61 },
  { symbol: 'NVDA', price: 131.27, delta: 2.48 },
  { symbol: 'TSLA', price: 342.1, delta: -1.36 },
  { symbol: 'AMZN', price: 205.74, delta: 0.93 },
  { symbol: 'META', price: 592.66, delta: 1.71 },
  { symbol: 'AMD', price: 122.55, delta: -0.58 },
  { symbol: 'JPM', price: 244.31, delta: 0.22 },
  { symbol: 'GOOGL', price: 178.02, delta: 0.47 },
  { symbol: 'XOM', price: 118.9, delta: -0.31 },
];

const TRADERS = [
  '@delta_hunter',
  '@iron_condor_kate',
  '@tape_reader',
  '@gamma_flow',
  '@value_velocity',
  '@swing_sheriff',
];

export const TIMEFRAME_CANDLES: Record<string, number> = {
  '1m': 60,
  '5m': 52,
  '15m': 44,
  '1H': 36,
  '1D': 30,
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function nowTime(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

class MarketEngine {
  symbols = new Map<string, SymbolState>();
  version = 0;
  private listeners = new Set<() => void>();
  private candleCache = new Map<string, Candle[]>();
  private candleListeners = new Map<string, Set<() => void>>();
  private feedListeners = new Set<(e: MirrorEvent) => void>();
  private timers: ReturnType<typeof setInterval>[] = [];
  private eventId = 0;
  private started = false;
  reducedMotion = false;

  constructor() {
    for (const { symbol, price, delta } of TAPE_SYMBOLS) {
      const rng = mulberry32(hashCode(symbol));
      let v = price * (1 - delta / 200);
      const spark: number[] = [];
      for (let i = 0; i < 24; i++) {
        v += (rng() - 0.48) * price * 0.0012;
        spark.push(v);
      }
      spark[spark.length - 1] = price;
      this.symbols.set(symbol, {
        symbol,
        price,
        prevPrice: price,
        baseDeltaPct: delta,
        deltaPct: delta,
        spark,
        tickDir: 0,
        tickId: 0,
      });
    }
    if (typeof window !== 'undefined') {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  get(symbol: string): SymbolState {
    return this.symbols.get(symbol) ?? this.symbols.get('AAPL')!;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getVersion = () => this.version;

  private emit() {
    this.version++;
    this.listeners.forEach((fn) => fn());
  }

  /** Deterministic base candle series for a symbol/timeframe. */
  getCandles(symbol: string, tf: string): Candle[] {
    const key = `${symbol}:${tf}`;
    const cached = this.candleCache.get(key);
    if (cached) return cached;
    const rng = mulberry32(hashCode(key));
    const count = TIMEFRAME_CANDLES[tf] ?? 48;
    const anchor = this.get(symbol).price;
    const vol = anchor * 0.0035;
    // build backwards from anchor so the series always ends near the live price
    const candles: Candle[] = new Array(count);
    let c = anchor;
    for (let i = count - 1; i >= 0; i--) {
      const o = c + (rng() - 0.5) * 2 * vol;
      const h = Math.max(o, c) + rng() * vol * 0.9;
      const l = Math.min(o, c) - rng() * vol * 0.9;
      const v = Math.round(400 + rng() * 2200);
      candles[i] = { o, h, l, c, v };
      c = o;
    }
    this.candleCache.set(key, candles);
    return candles;
  }

  subscribeCandles(symbol: string, tf: string, fn: () => void) {
    const key = `${symbol}:${tf}`;
    if (!this.candleListeners.has(key)) this.candleListeners.set(key, new Set());
    this.candleListeners.get(key)!.add(fn);
    this.getCandles(symbol, tf);
    return () => {
      this.candleListeners.get(key)?.delete(fn);
    };
  }

  subscribeFeed(fn: (e: MirrorEvent) => void) {
    this.feedListeners.add(fn);
    return () => {
      this.feedListeners.delete(fn);
    };
  }

  start() {
    if (this.started || this.reducedMotion) return;
    this.started = true;

    // price ticks every 2.5s
    this.timers.push(
      setInterval(() => {
        const keys = [...this.symbols.keys()];
        const sym = keys[Math.floor(Math.random() * keys.length)];
        const s = this.symbols.get(sym)!;
        const pct = (0.02 + Math.random() * 0.13) / 100;
        const dir = Math.random() > 0.45 ? 1 : -1;
        s.prevPrice = s.price;
        s.price = +(s.price * (1 + dir * pct)).toFixed(2);
        s.deltaPct = +(s.deltaPct + dir * pct * 100).toFixed(2);
        s.tickDir = dir as 1 | -1;
        s.tickId++;
        s.spark.push(s.price);
        if (s.spark.length > 24) s.spark.shift();
        this.emit();
      }, 2500),
    );

    // live candle updates every 2s for subscribed charts
    this.timers.push(
      setInterval(() => {
        this.candleListeners.forEach((fns, key) => {
          if (fns.size === 0) return;
          const candles = this.candleCache.get(key);
          if (!candles || candles.length === 0) return;
          const last = candles[candles.length - 1];
          const sym = key.split(':')[0];
          const live = this.get(sym).price;
          const vol = live * 0.002;
          if (Math.random() > 0.55) {
            // roll a new candle
            const o = last.c;
            const c = live + (Math.random() - 0.5) * vol;
            candles.push({
              o,
              h: Math.max(o, c) + Math.random() * vol * 0.5,
              l: Math.min(o, c) - Math.random() * vol * 0.5,
              c,
              v: Math.round(300 + Math.random() * 1200),
            });
            if (candles.length > 80) candles.shift();
          } else {
            last.c = live + (Math.random() - 0.5) * vol * 0.4;
            last.h = Math.max(last.h, last.c);
            last.l = Math.min(last.l, last.c);
            last.v += Math.round(Math.random() * 120);
          }
          fns.forEach((fn) => fn());
        });
      }, 2000),
    );

    // mirror feed events every 3-6s
    const scheduleFeed = () => {
      setTimeout(() => {
        if (!document.hidden) {
          this.feedListeners.forEach((fn) => fn(this.randomFeedEvent()));
        }
        scheduleFeed();
      }, 3000 + Math.random() * 3000);
    };
    scheduleFeed();
  }

  randomFeedEvent(): MirrorEvent {
    const trader = TRADERS[Math.floor(Math.random() * TRADERS.length)];
    const sym = TAPE_SYMBOLS[Math.floor(Math.random() * TAPE_SYMBOLS.length)];
    const side: 'buy' | 'sell' = Math.random() > 0.42 ? 'buy' : 'sell';
    const isOption = Math.random() > 0.55;
    const px = this.get(sym.symbol).price;
    let action: string;
    if (isOption) {
      const cp = side === 'buy' ? 'C' : Math.random() > 0.5 ? 'C' : 'P';
      const strike = Math.round((px * (cp === 'C' ? 1.02 : 0.98)) / 5) * 5;
      const expiry = '250117';
      const contracts = 1 + Math.floor(Math.random() * 9);
      const prem = (1 + Math.random() * 14).toFixed(2);
      action = `${side === 'buy' ? 'BOUGHT' : 'SOLD'} ${contracts} ${sym.symbol} ${expiry}${cp}${strike} @ ${prem}`;
    } else {
      const qty = (1 + Math.floor(Math.random() * 12)) * 5;
      action = `${side === 'buy' ? 'BOUGHT' : 'SOLD'} ${qty} ${sym.symbol} @ ${px.toFixed(2)}`;
    }
    return { id: ++this.eventId, time: nowTime(), trader, action, side };
  }
}

export const market = new MarketEngine();
