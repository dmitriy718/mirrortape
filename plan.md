# Plan — Copy-Trading SaaS Landing (Global Market Dashboard replica style)

## Goal
A single-page marketing landing for a NEW copy-trading SaaS (stocks & options only, no crypto),
styled as a premium "Global Market Dashboard" — dark terminal fintech aesthetic.
Includes an embedded, interactive live-market dashboard demo as the product teaser.

## Brand
Orchestrator picks a fitting name (candidate: "CopyDesk" / "MirrorTape" — finalize at design stage).

## Stage 1 — Skill load & design direction
- Load `vibecoding-webapp-swarm` (orchestration) + `webapp-building-swarm` (artifact) + `musepool` (anti-generic design inspiration).
- Read product-knowledge.md for delivery mechanics.
- Output: design brief (palette, type, layout, motion) + brand name.

## Stage 2 — Build (sub-agent, coder)
- React + TypeScript + Tailwind + shadcn/ui via webapp-building-swarm.
- Sections: sticky ticker tape nav → hero with live dashboard mock → embedded interactive dashboard demo
  (watchlist, candle/line charts, top-trader leaderboard, options flow panel, portfolio copy simulator)
  → features → how-it-works → pricing → compliance/risk disclosure footer.
- All market data simulated in-browser (deterministic mock engine); stocks & options only, no crypto anywhere.
- Charts: lightweight SVG/Canvas or recharts; no external API keys.

## Stage 3 — Review & polish
- Reviewer sub-agent checks: visual quality vs brief, responsiveness, no crypto references, no console errors, build passes.

## Stage 4 — Deliver
- Build production bundle, save version via mshtools-website_version_manager (type: static).
- Report brand name + preview instructions.
