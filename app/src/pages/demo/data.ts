/** Shared constants for the /demo terminal page. All data is simulated. */

export const WATCHLIST: Array<{ symbol: string; name: string }> = [
  { symbol: 'AAPL', name: 'Apple Inc' },
  { symbol: 'NVDA', name: 'NVIDIA Corp' },
  { symbol: 'MSFT', name: 'Microsoft Corp' },
  { symbol: 'TSLA', name: 'Tesla Inc' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'AMZN', name: 'Amazon.com Inc' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'GOOGL', name: 'Alphabet Inc' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'XOM', name: 'Exxon Mobil Corp' },
];

export const TIMEFRAMES = ['1m', '5m', '15m', '1H', '1D'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export type ChartType = 'candles' | 'line';

export type ViewTab = 'TERMINAL' | 'POSITIONS' | 'FLOW' | 'ALERTS';
export const VIEW_TABS: ViewTab[] = ['TERMINAL', 'POSITIONS', 'FLOW', 'ALERTS'];

export const MIRRORED_TRADERS: Array<{
  handle: string;
  avatar: string;
  todayPnl: number;
}> = [
  { handle: '@delta_hunter', avatar: '/avatar-01.png', todayPnl: 842.2 },
  { handle: '@iron_condor_kate', avatar: '/avatar-02.png', todayPnl: 317.45 },
  { handle: '@gamma_flow', avatar: '/avatar-03.png', todayPnl: -128.9 },
];

/* ---------------- Copied positions ---------------- */

export interface CopiedPosition {
  id: string;
  /** display label, e.g. `NVDA 250221C150` */
  label: string;
  /** underlying symbol for live marks + chart swap */
  underlying: string;
  kind: 'shares' | 'calls' | 'puts';
  qty: number; // shares or contracts
  avg: number; // average entry (per share / per contract unit)
  /** underlying price at entry, used to scale option marks */
  entryUnderlying: number;
  /** mark at engine boot, so options move with the underlying */
  bootMark: number;
  via: string;
}

export const POSITIONS: CopiedPosition[] = [
  { id: 'p1', label: 'AAPL', underlying: 'AAPL', kind: 'shares', qty: 50, avg: 232.92, entryUnderlying: 238.42, bootMark: 238.42, via: '@delta_hunter' },
  { id: 'p2', label: 'NVDA 250221C150', underlying: 'NVDA', kind: 'calls', qty: 5, avg: 7.9, entryUnderlying: 131.27, bootMark: 8.35, via: '@gamma_flow' },
  { id: 'p3', label: 'MSFT', underlying: 'MSFT', kind: 'shares', qty: 20, avg: 421.4, entryUnderlying: 428.9, bootMark: 428.9, via: '@value_velocity' },
  { id: 'p4', label: 'TSLA 250117P340', underlying: 'TSLA', kind: 'puts', qty: 3, avg: 9.1, entryUnderlying: 342.1, bootMark: 11.05, via: '@swing_sheriff' },
  { id: 'p5', label: 'SPY 250131C600', underlying: 'SPY', kind: 'calls', qty: 4, avg: 4.62, entryUnderlying: 597.42, bootMark: 5.2, via: '@iron_condor_kate' },
  { id: 'p6', label: 'AMD', underlying: 'AMD', kind: 'shares', qty: 80, avg: 124.83, entryUnderlying: 122.55, bootMark: 122.55, via: '@tape_reader' },
];

/** Live mark for a position given the underlying's current price. */
export function positionMark(p: CopiedPosition, liveUnderlying: number): number {
  if (p.kind === 'shares') return liveUnderlying;
  const ratio = liveUnderlying / p.entryUnderlying;
  // calls gain as underlying rises; puts gain as it falls (simplified sim)
  return p.kind === 'calls' ? p.bootMark * ratio : p.bootMark / ratio;
}

export function positionPnl(p: CopiedPosition, liveUnderlying: number): number {
  const mult = p.kind === 'shares' ? 1 : 100;
  return (positionMark(p, liveUnderlying) - p.avg) * p.qty * mult;
}

/* ---------------- Options flow ---------------- */

export interface FlowRow {
  id: number;
  time: string;
  contract: string;
  tag: 'SWEEP' | 'BLOCK' | 'SPLIT';
  premium: string;
  sentiment: 'mint' | 'red' | 'amber';
}

export const FLOW_SEED: FlowRow[] = [
  { id: 1, time: '14:32:07', contract: 'AAPL 250117C200', tag: 'SWEEP', premium: '$412K', sentiment: 'mint' },
  { id: 2, time: '14:31:52', contract: 'NVDA 250221C150', tag: 'BLOCK', premium: '$1.2M', sentiment: 'mint' },
  { id: 3, time: '14:31:18', contract: 'TSLA 250117P300', tag: 'SWEEP', premium: '$860K', sentiment: 'red' },
  { id: 4, time: '14:30:44', contract: 'SPY 250131C600', tag: 'SPLIT', premium: '$2.4M', sentiment: 'amber' },
  { id: 5, time: '14:30:11', contract: 'MSFT 250221C430', tag: 'SWEEP', premium: '$318K', sentiment: 'mint' },
  { id: 6, time: '14:29:02', contract: 'AMD 250117C125', tag: 'BLOCK', premium: '$540K', sentiment: 'red' },
  { id: 7, time: '14:28:36', contract: 'QQQ 250131C520', tag: 'SWEEP', premium: '$1.1M', sentiment: 'mint' },
  { id: 8, time: '14:27:58', contract: 'META 250221C600', tag: 'BLOCK', premium: '$2.0M', sentiment: 'mint' },
];

export const FLOW_POOL: Array<Omit<FlowRow, 'id' | 'time'>> = [
  { contract: 'JPM 250117P240', tag: 'SWEEP', premium: '$274K', sentiment: 'red' },
  { contract: 'XOM 250221C120', tag: 'SPLIT', premium: '$690K', sentiment: 'amber' },
  { contract: 'NVDA 250117P130', tag: 'SWEEP', premium: '$455K', sentiment: 'red' },
  { contract: 'AAPL 250221C240', tag: 'BLOCK', premium: '$980K', sentiment: 'mint' },
  { contract: 'TSLA 250221C350', tag: 'SWEEP', premium: '$1.4M', sentiment: 'mint' },
  { contract: 'GOOGL 250117C180', tag: 'BLOCK', premium: '$610K', sentiment: 'mint' },
  { contract: 'SPY 250117P595', tag: 'SWEEP', premium: '$730K', sentiment: 'red' },
  { contract: 'AMZN 250221C210', tag: 'SPLIT', premium: '$388K', sentiment: 'amber' },
];

/* ---------------- Alerts ---------------- */

export interface DemoAlert {
  id: number;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  time: string;
}

export const ALERT_SEED: DemoAlert[] = [
  {
    id: 1,
    severity: 'critical',
    title: 'Kill-switch proximity',
    body: '@gamma_flow drawdown -9.1% — 2.9% from your kill-switch level',
    time: '14:29:41',
  },
  {
    id: 2,
    severity: 'warning',
    title: 'Cap warning',
    body: 'TSLA position at 82% of your single-name cap',
    time: '14:26:13',
  },
  {
    id: 3,
    severity: 'info',
    title: 'New mirrored trade',
    body: '@iron_condor_kate opened a new SPY iron condor — mirrored as 4 contracts (cap applied)',
    time: '14:21:57',
  },
];

export const ALERT_POOL: Array<Omit<DemoAlert, 'id' | 'time'>> = [
  { severity: 'info', title: 'New mirrored trade', body: '@tape_reader added 40 MSFT shares — mirrored at 0.5x your allocation' },
  { severity: 'info', title: 'Position closed', body: '@delta_hunter closed XOM shares for +6.2% — mirrored exit filled' },
  { severity: 'warning', title: 'Cap warning', body: 'NVDA options exposure at 71% of your per-contract cap' },
  { severity: 'info', title: 'Trader resumed', body: '@value_velocity resumed trading after 2 days idle — mirroring active' },
];

/* ---------------- helpers ---------------- */

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function nowTime(): string {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function etClock(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${pad2(parseInt(get('hour'), 10) % 24)}:${get('minute')}:${get('second')}`;
}

export function fmtMoney(v: number): string {
  const sign = v >= 0 ? '+' : '-';
  const abs = Math.abs(v);
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
