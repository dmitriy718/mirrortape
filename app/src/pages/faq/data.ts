/** FAQ page data — 24 questions in 5 categories (per design/faq.md). */

export interface FaqEntry {
  q: string;
  a: string;
}

export interface FaqCategory {
  id: string;
  label: string;
  items: FaqEntry[];
}

export const CATEGORIES: FaqCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    items: [
      {
        q: 'What exactly is MirrorTape?',
        a: "A signal-relay platform: verified traders' real stock and options fills are mirrored into your own brokerage account under limits you set. MirrorTape is not a broker and not an investment advisor — custody and execution stay at your broker.",
      },
      {
        q: 'Which brokers are supported?',
        a: 'Alpaca, Interactive Brokers, Charles Schwab, Webull, E*TRADE, and tastytrade — with more added quarterly. Your account stays at your broker; MirrorTape never takes custody of funds or securities.',
      },
      {
        q: 'How fast can I start?',
        a: 'Paper mirroring is instant. Live mirroring starts after you link your broker (~5 minutes), plus any broker-side options approval you need for options strategies.',
      },
      {
        q: 'Do I need a minimum balance?',
        a: "There is no MirrorTape minimum. Your broker's own minimums and pattern-day-trading rules still apply to your account.",
      },
      {
        q: 'Can I use it on mobile?',
        a: 'Yes — the terminal is fully responsive. The kill switch and alerts are one tap away on any device.',
      },
    ],
  },
  {
    id: 'copying-mechanics',
    label: 'Copying Mechanics',
    items: [
      {
        q: 'How fast are trades mirrored?',
        a: 'Median ~38ms from signal capture to order routed. Your actual fill depends on your broker and market liquidity.',
      },
      {
        q: 'Will I get the same price as the trader?',
        a: 'Usually close, but not guaranteed. Slippage and sizing differences are disclosed on every mirrored fill.',
      },
      {
        q: 'How is position size decided?',
        a: 'Your allocation percentage per trader, scaled by your equity, then clamped by your per-trade and sector caps.',
      },
      {
        q: 'Can I copy a trader manually instead?',
        a: 'Yes — every signal appears in your feed with a one-click MIRROR THIS button if automation is paused.',
      },
      {
        q: 'Can I mirror only stocks, not options, from a mixed trader?',
        a: 'Yes — instrument filters per trader let you exclude options or equities from any mirrored strategy.',
      },
      {
        q: 'What happens when a trader I copy stops trading?',
        a: 'Alerts fire immediately. Positions stay open under your control, and copying pauses until you resume or reassign your allocation.',
      },
    ],
  },
  {
    id: 'options',
    label: 'Options',
    items: [
      {
        q: 'Do I need options approval from my broker?',
        a: "Yes. MirrorTape never mirrors a strategy your approval level can't hold — those orders are rejected and logged.",
      },
      {
        q: 'Which options strategies can be mirrored?',
        a: 'Long calls and puts, covered calls, cash-secured puts, verticals, and iron condors — subject to your approval level and your caps.',
      },
      {
        q: 'Are multi-leg orders mirrored atomically?',
        a: 'Yes — legs route as a single combo order to your broker to avoid legging risk.',
      },
      {
        q: 'What are the risks?',
        a: 'Options involve risk and are not suitable for all investors — read the Characteristics and Risks of Standardized Options (ODD) before trading. Mirroring adds timing and slippage differences on top of strategy risk.',
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & Account',
    items: [
      {
        q: 'What does MirrorTape cost?',
        a: '$0 for Paper, $49/mo for Mirror, and $129/mo for Mirror Pro — 20% off with annual billing. No per-trade markup, ever.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes — 14 days of live mirroring on the MIRROR tier, no card required.',
      },
      {
        q: 'What happens to my positions if I cancel?',
        a: "Nothing — they're at your broker and remain entirely yours. Mirroring simply stops.",
      },
      {
        q: 'Do you profit from my trades?',
        a: 'No commissions, no payment for order flow, no cut of your P/L. Flat subscription only.',
      },
    ],
  },
  {
    id: 'security',
    label: 'Security & Trust',
    items: [
      {
        q: 'Can MirrorTape withdraw my money?',
        a: 'No. API scopes are trade-only — withdrawal permissions are never requested and never stored.',
      },
      {
        q: 'How is my broker connection secured?',
        a: 'OAuth-style tokenized links, TLS 1.3 in transit, AES-256 encryption at rest, with tokens held in an isolated vault.',
      },
      {
        q: 'How are leaderboard stats verified?',
        a: 'From connected brokerage fills — 12+ months and 200+ trades minimum, quarterly re-audit, and delisting on any mismatch.',
      },
      {
        q: 'Can traders see my account?',
        a: 'Never. Traders see aggregate follower counts only — no identities, no positions, no balances.',
      },
      {
        q: 'Is past performance a guarantee?',
        a: 'No — even audited performance does not guarantee future results. See /risk for the full disclosure.',
      },
    ],
  },
];

export const FAQ_COUNT = CATEGORIES.reduce((n, c) => n + c.items.length, 0);
