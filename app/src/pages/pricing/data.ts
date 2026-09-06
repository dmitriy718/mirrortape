/** Pricing page data — tiers, feature matrix, mini-FAQ (per design/pricing.md). */

export interface TierFeature {
  text: string;
  included: boolean;
}

export interface Tier {
  id: 'paper' | 'mirror' | 'pro';
  name: string;
  monthly: number;
  annual: number; // per-month price when billed annually
  tagline: string;
  features: TierFeature[];
  cta: string;
  ctaVariant: 'primary' | 'ghost';
  popular?: boolean;
}

export const TIERS: Tier[] = [
  {
    id: 'paper',
    name: 'Paper',
    monthly: 0,
    annual: 0,
    tagline: 'Free forever',
    features: [
      { text: 'Full demo terminal (simulated)', included: true },
      { text: 'Paper mirroring of 3 traders', included: true },
      { text: 'Watchlists + charts', included: true },
      { text: 'Community leaderboard', included: true },
      { text: 'Live mirroring', included: false },
      { text: 'Options flow feed', included: false },
    ],
    cta: 'Start paper trading',
    ctaVariant: 'ghost',
  },
  {
    id: 'mirror',
    name: 'Mirror',
    monthly: 49,
    annual: 39,
    tagline: 'For your first live mirrors',
    features: [
      { text: 'Live mirroring — 5 traders', included: true },
      { text: 'Full risk engine (caps + kill switch)', included: true },
      { text: 'Stocks + options mirroring', included: true },
      { text: 'Real-time alerts', included: true },
      { text: 'Standard support', included: true },
      { text: 'Options flow feed', included: false },
    ],
    cta: '▸ Start Mirroring',
    ctaVariant: 'primary',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Mirror Pro',
    monthly: 129,
    annual: 103,
    tagline: 'For serious tape readers',
    features: [
      { text: 'Unlimited mirrored traders', included: true },
      { text: 'Options flow feed (sweeps/blocks)', included: true },
      { text: 'Multi-broker accounts', included: true },
      { text: 'API + webhooks', included: true },
      { text: 'Priority execution lane', included: true },
      { text: 'Priority support', included: true },
    ],
    cta: 'Go Pro',
    ctaVariant: 'ghost',
  },
];

export type MatrixCell = 'check' | 'cross' | 'dash' | string;

export interface MatrixRow {
  feature: string;
  cells: [MatrixCell, MatrixCell, MatrixCell];
}

export interface MatrixGroup {
  label: string;
  rows: MatrixRow[];
}

export const MATRIX: MatrixGroup[] = [
  {
    label: 'Mirroring',
    rows: [
      { feature: 'Live mirroring', cells: ['cross', 'check', 'check'] },
      { feature: 'Max mirrored traders', cells: ['3 (paper)', '5', 'Unlimited'] },
      { feature: 'Allocation caps', cells: ['cross', 'check', 'check'] },
      { feature: 'Kill switch', cells: ['cross', 'check', 'check'] },
      { feature: 'Per-trade limits', cells: ['cross', 'check', 'check'] },
    ],
  },
  {
    label: 'Data',
    rows: [
      { feature: 'Real-time quotes', cells: ['dash', 'check', 'check'] },
      { feature: 'Options flow feed', cells: ['dash', 'dash', 'check'] },
      { feature: 'Historical fills', cells: ['check', 'check', 'check'] },
    ],
  },
  {
    label: 'Platform',
    rows: [
      { feature: 'Broker connections', cells: ['1', '1', '3'] },
      { feature: 'API + webhooks', cells: ['cross', 'cross', 'check'] },
      { feature: 'Alerts', cells: ['cross', 'check', 'check'] },
    ],
  },
  {
    label: 'Support',
    rows: [{ feature: 'Support channel', cells: ['Community', 'Standard', 'Priority'] }],
  },
];

export const MINI_FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Monthly plans cancel at the end of the current billing cycle, and annual plans are prorated per our terms. No lock-in, no exit fees.',
  },
  {
    q: 'Is there a free trial of MIRROR?',
    a: 'Yes — 14 days of live mirroring on the MIRROR tier, no card required. Paper mirroring stays free forever either way.',
  },
  {
    q: 'What happens to my positions if I cancel?',
    a: 'Nothing happens to them. Your positions live at your broker and remain entirely yours — mirroring simply stops.',
  },
  {
    q: 'Do you take a cut of my profits?',
    a: 'Never. MirrorTape is a flat subscription only — no commissions, no payment for order flow, no percentage of your P/L.',
  },
];

export const FINE_PRINT =
  'Subscription is the only MirrorTape fee. Your broker charges its own commissions, contract fees, and regulatory fees on mirrored trades. Options involve risk and are not suitable for all investors. Past performance — even verified, audited performance — does not guarantee future results.';
