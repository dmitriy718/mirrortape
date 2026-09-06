# Research & Design Direction Findings

## Product
- Brand name: **MirrorTape** — copy-trading SaaS for the US stock market. **Stocks and options ONLY. Absolutely no crypto anywhere** (no tickers like BTC/ETH, no crypto icons, no "digital assets" copy).
- Core promise: follow verified top traders, mirror their stock & options trades automatically in your own brokerage account, with risk controls.
- Audience: retail investors who want pro-level execution without watching the tape all day.

## Visual direction (distilled from dark financial-terminal design precedents)

### Color
- Dark-dominant "intelligence terminal" palette. Background near-black blue `#050810`; panel surfaces `#0c1220` / `#111a2b`; hairline borders `#1a2540` (1px, no heavy shadows).
- Semantic market accents ONLY: cyan `#22d3ee` (live/active/brand), mint/emerald `#34d399` (gains/positive), red `#f87171` (losses/risk), amber `#fbbf24` (warnings/pending). No blue-purple gradients, no decorative rainbows.
- Text: white primary, `#9ca3af` secondary, `#6b7280` tertiary.
- Subtle radial background gradients for depth; green/red used strictly semantically for market data.

### Typography
- Dual-font system: **JetBrains Mono** for ALL data, numerals, tickers, labels, UI chrome (300–700); **Inter** for headlines and longer reading copy (400–800). (Space Grotesk acceptable alternative for display headlines.)
- Hierarchy via size (9px–64px), weight, and tracking — NOT color alone. Section labels: uppercase, letter-spacing 0.08–0.22em, tiny mono.
- Tabular numerals everywhere data appears.

### Layout
- Signature: **live dashboard embedded as the hero centerpiece** — a real, working-feeling product interface (not a static mockup image): ticker tape banner, watchlist panel, candlestick/line chart, top-trader leaderboard with copy buttons, options-flow feed, portfolio sparklines.
- Mission-control density: three-column dashboard zones (left watchlist ~280px, fluid center chart, right panel ~380px), 12px base grid, 1px hairline dividers, panels separated by borders not nested cards (no card-in-card).
- Landing structure around the hero: scrolling ticker tape strip → hero w/ embedded live dashboard → how-it-works (3 phases) → trader leaderboard feature → risk controls → pricing → FAQ → compliance/risk disclosure footer.

### Components & craft
- Ticker tape: marquee of stock/ETF symbols with price + green/red delta, pause on hover.
- Status LEDs / pulsing live dots (1.4–1.6s ease-in-out), "LIVE" badges.
- Leaderboard rows: rank, trader name/avatar-initial, mono ROI stats (win rate, 12M return, max drawdown), equity sparkline (inline SVG), "COPY" pill button.
- Options flow feed: time-ordered rows with contract description in mono (e.g. `AAPL 250117C200`), sweep/block tag, premium size, sentiment color.
- Alert cards with 3px left-border severity accents. Gauge-style risk meter.
- Comparison table vs. "doing it yourself" with check indicators.

### Motion
- Ambient, purposeful only: pulsing live dots, slow ticker scroll (~48s linear, pauses on hover), numbers ticking on an interval, collapsible sections with max-height transitions (0.42s cubic-bezier), 0.15s hover transitions. `prefers-reduced-motion` respected. No scroll-jacking, no meaningless fade-in-up everywhere, no loading spinners as decoration.

### Imagery
- No stock photography. The interface IS the imagery: SVG sparklines, canvas/SVG charts, vector status indicators. Any generated art must stay in the dark terminal palette.

## Compliance notes (content)
- Footer and hero microcopy must include realistic risk disclosure: "Options involve risk and are not suitable for all investors. Past performance does not guarantee future results. MirrorTape is a technology platform, not a broker-dealer or investment advisor."
