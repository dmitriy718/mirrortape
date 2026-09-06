/**
 * Static-but-plausible verified trader dataset for /traders.
 * Sparklines and 12M equity curves are generated inline from seeded series.
 * Stocks & options only — zero crypto references.
 */

export type Strategy = 'SWING' | 'DAY' | 'POSITION';
export type Instrument = 'STOCKS' | 'OPTIONS' | 'MIXED';
export type SortKey = 'ret12m' | 'win' | 'dd' | 'followers';

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'ret12m', label: '12M RETURN' },
  { key: 'win', label: 'WIN RATE' },
  { key: 'dd', label: 'LOWEST DRAWDOWN' },
  { key: 'followers', label: 'FOLLOWERS' },
];

export interface Holding {
  symbol: string;
  weight: number; // % of book
  pnl: number; // unrealized P/L %
}

export interface Trader {
  rank: number;
  handle: string;
  name: string;
  avatar: string;
  strategy: Strategy;
  instrument: Instrument;
  ret12m: number;
  ret90d: number;
  win: number;
  dd: number; // max drawdown, negative
  avgHold: string;
  sharpe: number;
  followers: number;
  copying?: boolean;
  spark: number[]; // 90D sparkline series (cumulative %)
  equity: number[]; // 12M equity curve (cumulative %, starts at 0)
  holdings: Holding[];
  fills: string[];
}

/* ---------------- seeded PRNG + series generators ---------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cumulative-% series of n points ending exactly at totalRet (starts at 0). */
function genSeries(seed: number, n: number, totalRet: number): number[] {
  const rnd = mulberry32(seed);
  const raw: number[] = [0];
  const drift = totalRet / (n - 1);
  const vol = Math.max(1.2, Math.abs(totalRet) / (n - 1)) * 1.6;
  for (let i = 1; i < n; i++) {
    raw.push(raw[i - 1] + drift + (rnd() - 0.48) * vol);
  }
  const end = raw[n - 1] || 1;
  const scale = totalRet / end;
  return raw.map((v, i) => (i === 0 ? 0 : +(v * scale).toFixed(2)));
}

/* ---------------- market pools (equities & ETFs only) ---------------- */

const PRICES: Record<string, number> = {
  NVDA: 188.42, AAPL: 238.42, MSFT: 428.15, AMD: 122.3, AVGO: 172.55,
  JPM: 244.8, XOM: 118.2, LLY: 782.4, META: 585.1, TSLA: 342.6,
  AMZN: 205.7, GOOGL: 178.35, CRM: 331.25, COST: 925.4, PLTR: 66.8,
  UNH: 512.3, V: 309.45, HD: 402.15, GE: 228.9, CAT: 385.6,
  SPY: 598.2, QQQ: 512.85,
};
const STOCK_POOL = Object.keys(PRICES);
const EXPIRIES = ['19DEC', '16JAN', '20FEB', '20MAR', '17APR', '19JUN'];

function pickStocks(rnd: () => number, count: number): string[] {
  const pool = [...STOCK_POOL];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  }
  return out;
}

function optionContract(sym: string, rnd: () => number): string {
  const base = PRICES[sym];
  const strike = Math.round((base * (rnd() > 0.5 ? 1.04 : 0.96)) / 5) * 5;
  const cp = rnd() > 0.42 ? 'C' : 'P';
  const exp = EXPIRIES[Math.floor(rnd() * EXPIRIES.length)];
  return `${sym} ${strike}${cp} ${exp}`;
}

function genHoldings(seed: number, instrument: Instrument, ret12m: number): Holding[] {
  const rnd = mulberry32(seed);
  const syms = pickStocks(rnd, 5);
  const weights: number[] = [];
  let total = 0;
  for (let i = 0; i < 5; i++) {
    const w = i === 4 ? 0 : +(8 + rnd() * 22).toFixed(1);
    weights.push(w);
    total += w;
  }
  weights[4] = +(Math.max(6, 88 - total)).toFixed(1);
  weights.sort((a, b) => b - a);
  const bias = ret12m > 100 ? 6 : ret12m > 60 ? 3 : 1;
  return syms.map((sym, i) => {
    const isOption =
      instrument === 'OPTIONS' ? rnd() > 0.25 : instrument === 'MIXED' ? rnd() > 0.6 : false;
    return {
      symbol: isOption ? optionContract(sym, rnd) : sym,
      weight: weights[i],
      pnl: +((rnd() - 0.32) * 14 + bias).toFixed(2),
    };
  });
}

function genFills(seed: number, instrument: Instrument, followers: number): string[] {
  const rnd = mulberry32(seed);
  const syms = pickStocks(rnd, 6);
  return syms.map((sym) => {
    const side = rnd() > 0.45 ? 'BOT' : 'SOLD';
    const isOption =
      instrument === 'OPTIONS' ? rnd() > 0.3 : instrument === 'MIXED' ? rnd() > 0.55 : false;
    const mirrored = Math.max(14, Math.round(followers * (0.04 + rnd() * 0.09)));
    if (isOption) {
      const qty = 5 + Math.floor(rnd() * 60);
      const premium = (1.2 + rnd() * 14).toFixed(2);
      return `${side} ${qty} ${optionContract(sym, rnd)} @${premium} · mirrored by ${mirrored.toLocaleString('en-US')} accounts`;
    }
    const qty = 10 + Math.floor(rnd() * 240);
    return `${side} ${qty} ${sym} @${PRICES[sym].toFixed(2)} · mirrored by ${mirrored.toLocaleString('en-US')} accounts`;
  });
}

/* ---------------- core verified stats (rows 1–15 per design spec) ---------------- */

interface Core {
  handle: string;
  name: string;
  strategy: Strategy;
  instrument: Instrument;
  ret12m: number;
  ret90d: number;
  win: number;
  dd: number;
  avgHold: string;
  sharpe: number;
  followers: number;
  copying?: boolean;
}

const CORE: Core[] = [
  { handle: '@delta_hunter', name: 'Marcus Vane', strategy: 'DAY', instrument: 'MIXED', ret12m: 214.6, ret90d: 38.2, win: 71.2, dd: -11.4, avgHold: '3.8H', sharpe: 2.84, followers: 18204, copying: true },
  { handle: '@iron_condor_kate', name: 'Kate Okafor', strategy: 'POSITION', instrument: 'OPTIONS', ret12m: 162.3, ret90d: 24.6, win: 78.9, dd: -6.8, avgHold: '21D', sharpe: 2.61, followers: 12847 },
  { handle: '@tape_reader', name: 'Danny Ruiz', strategy: 'DAY', instrument: 'STOCKS', ret12m: 141.8, ret90d: 21.9, win: 66.4, dd: -14.2, avgHold: '2.1H', sharpe: 2.12, followers: 9312 },
  { handle: '@gamma_flow', name: 'Priya Nair', strategy: 'SWING', instrument: 'OPTIONS', ret12m: 118.5, ret90d: 17.4, win: 69.1, dd: -9.7, avgHold: '4.6D', sharpe: 2.03, followers: 7556 },
  { handle: '@value_velocity', name: 'Tom Ellery', strategy: 'POSITION', instrument: 'STOCKS', ret12m: 96.2, ret90d: 12.8, win: 74.3, dd: -5.9, avgHold: '46D', sharpe: 2.22, followers: 6120 },
  { handle: '@swing_sheriff', name: 'Wade Booker', strategy: 'SWING', instrument: 'STOCKS', ret12m: 88.7, ret90d: 11.3, win: 63.8, dd: -12.6, avgHold: '6.2D', sharpe: 1.78, followers: 4983 },
  { handle: '@theta_farmer', name: 'Iris Lang', strategy: 'POSITION', instrument: 'OPTIONS', ret12m: 84.1, ret90d: 13.7, win: 76.5, dd: -4.2, avgHold: '18D', sharpe: 2.47, followers: 3201 },
  { handle: '@momentum_marq', name: 'Marq Delgado', strategy: 'SWING', instrument: 'STOCKS', ret12m: 79.8, ret90d: 9.4, win: 61.2, dd: -16.8, avgHold: '5.1D', sharpe: 1.52, followers: 2947 },
  { handle: '@sector_surfer', name: 'Noa Feld', strategy: 'SWING', instrument: 'MIXED', ret12m: 72.4, ret90d: 10.8, win: 67.9, dd: -10.3, avgHold: '7.4D', sharpe: 1.69, followers: 2655 },
  { handle: '@quiet_compounder', name: 'Sam Alden', strategy: 'POSITION', instrument: 'STOCKS', ret12m: 68.9, ret90d: 8.2, win: 72.1, dd: -3.8, avgHold: '58D', sharpe: 2.38, followers: 2410 },
  { handle: '@catalyst_carl', name: 'Carl Benoit', strategy: 'DAY', instrument: 'MIXED', ret12m: 61.5, ret90d: 7.6, win: 58.4, dd: -18.2, avgHold: '1.4H', sharpe: 1.31, followers: 1988 },
  { handle: '@premium_harvest', name: 'June Park', strategy: 'POSITION', instrument: 'OPTIONS', ret12m: 57.2, ret90d: 9.9, win: 81.3, dd: -5.5, avgHold: '16D', sharpe: 2.55, followers: 1742 },
  { handle: '@breakout_bishop', name: 'Bishop Cole', strategy: 'DAY', instrument: 'STOCKS', ret12m: 52.8, ret90d: 6.8, win: 60.7, dd: -13.9, avgHold: '2.7H', sharpe: 1.44, followers: 1506 },
  { handle: '@mean_reversion_m', name: 'Mara Voss', strategy: 'SWING', instrument: 'MIXED', ret12m: 48.3, ret90d: 5.9, win: 70.2, dd: -8.4, avgHold: '3.9D', sharpe: 1.66, followers: 1233 },
  { handle: '@dividend_dagger', name: 'Hank Sutter', strategy: 'POSITION', instrument: 'STOCKS', ret12m: 41.6, ret90d: 5.1, win: 68.8, dd: -4.9, avgHold: '64D', sharpe: 1.92, followers: 1104 },
  /* rows 16–25 — appended via "Load more" */
  { handle: '@opening_range', name: 'Abe Fontaine', strategy: 'DAY', instrument: 'STOCKS', ret12m: 38.9, ret90d: 4.6, win: 59.6, dd: -12.1, avgHold: '1.9H', sharpe: 1.28, followers: 987 },
  { handle: '@covered_call_co', name: 'Rita Madsen', strategy: 'POSITION', instrument: 'OPTIONS', ret12m: 36.4, ret90d: 6.3, win: 79.8, dd: -3.1, avgHold: '27D', sharpe: 2.31, followers: 912 },
  { handle: '@tide_turner', name: 'Leah Byrne', strategy: 'SWING', instrument: 'MIXED', ret12m: 33.7, ret90d: 3.8, win: 62.5, dd: -9.8, avgHold: '6.8D', sharpe: 1.41, followers: 845 },
  { handle: '@float_hunter', name: 'Gus Whitaker', strategy: 'DAY', instrument: 'STOCKS', ret12m: 31.2, ret90d: -2.4, win: 57.3, dd: -19.4, avgHold: '0.9H', sharpe: 1.05, followers: 764 },
  { handle: '@calendar_king', name: 'Otto Reyes', strategy: 'POSITION', instrument: 'OPTIONS', ret12m: 28.6, ret90d: 4.9, win: 74.1, dd: -4.6, avgHold: '31D', sharpe: 1.87, followers: 701 },
  { handle: '@relative_strength', name: 'Dana Iversen', strategy: 'SWING', instrument: 'STOCKS', ret12m: 26.9, ret90d: 3.2, win: 63.0, dd: -8.9, avgHold: '8.3D', sharpe: 1.36, followers: 655 },
  { handle: '@vwap_vic', name: 'Vic Harmon', strategy: 'DAY', instrument: 'STOCKS', ret12m: 24.3, ret90d: 2.7, win: 60.1, dd: -11.7, avgHold: '2.4H', sharpe: 1.19, followers: 588 },
  { handle: '@leaps_laura', name: 'Laura Chen', strategy: 'POSITION', instrument: 'OPTIONS', ret12m: 22.8, ret90d: 3.9, win: 66.6, dd: -7.2, avgHold: '92D', sharpe: 1.58, followers: 540 },
  { handle: '@earnings_edge', name: 'Dev Khatri', strategy: 'SWING', instrument: 'MIXED', ret12m: 19.5, ret90d: -1.1, win: 58.9, dd: -14.6, avgHold: '5.6D', sharpe: 0.98, followers: 472 },
  { handle: '@slow_sigma', name: 'Annika Rowe', strategy: 'POSITION', instrument: 'STOCKS', ret12m: 16.2, ret90d: 2.1, win: 69.4, dd: -2.9, avgHold: '74D', sharpe: 1.73, followers: 398 },
];

export const TRADERS: Trader[] = CORE.map((c, i) => {
  const seed = 1000 + i * 77;
  return {
    ...c,
    rank: i + 1,
    avatar: `/avatar-0${(i % 8) + 1}.png`,
    spark: genSeries(seed + 1, 10, c.ret90d),
    equity: genSeries(seed + 2, 37, c.ret12m),
    holdings: genHoldings(seed + 3, c.instrument, c.ret12m),
    fills: genFills(seed + 4, c.instrument, c.followers),
  };
});

/** 12-month window labels for the equity curve (DEC → NOV). */
export const EQUITY_MONTHS = ['DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV'];

export function fmtNum(n: number): string {
  return n.toLocaleString('en-US');
}

export function fmtSigned(n: number, digits = 1): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}`;
}
