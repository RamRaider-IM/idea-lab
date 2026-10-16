# Idea Lab

A personal dashboard for testing business ideas quickly and consistently, built on three playbooks:

- **Daniel Priestley** (Oversubscribed, Key Person of Influence): create demand before you build. Pitch, collect names and deposits, build only when people are waiting.
- **Alex Hormozi** ($100M Offers, $100M Leads): pick a starving crowd, score the value equation, build a grand slam offer, reach people through the core four channels.
- **Eric Ries** (The Lean Startup): leap-of-faith hypotheses, the MVP, innovation accounting, and a scheduled pivot-or-persevere decision.

Every idea moves through the same loop: **Plan → Research → Build & launch → Monitor → Decide**. Each phase has a gate with concrete, evidence-based criteria. The dashboard scores each idea (market, value, demand, traction), recommends scale / persevere / pivot / kill from the numbers, and keeps a decision log.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. On first run, click **Load examples** to see three worked ideas at different stages.

Build a static version with `npm run build` (output in `dist/`), which can be hosted anywhere or opened from a file server.

## Where the data lives

Everything is stored in the browser's localStorage under one key. There is no server and no account. Use **Settings & data → Export JSON** for backups or to move between machines, and **Import JSON** to restore.

## Structure

```
src/
  types.ts        data model, factories, default gates and checklist
  scoring.ts      market / value / demand / traction scores, gates, recommendation rules
  store.tsx       reducer + localStorage persistence + theme
  seed.ts         three example ideas
  components/
    ui.tsx        fields, ratings, chips, cards, modal, gate list, hash routing
    charts.tsx    sparkline, line chart with tooltip and table view, funnel
  pages/
    Portfolio.tsx KPI row, "needs you this week", pipeline board
    IdeaPage.tsx  idea shell + Overview (scores, gate, recommendation, decision log)
    PlanTab.tsx   avatar, market, founder fit, problems → solutions, value equation, offer, hypotheses, assumptions
    ResearchTab.tsx demand tests (waiting list, landing page, pre-sale, outreach...), interviews, insights
    LaunchTab.tsx MVP scope, channels, engine of growth, north star and weekly targets, checklist
    MonitorTab.tsx weekly metrics log, north-star chart, funnel, growth / conversion / LTV:CAC, reading
    DecideTab.tsx recommendation, gate, record scale / persevere / pivot / hold / kill
    Guide.tsx     the method, formulas and weekly rhythm
    SettingsPage.tsx gate thresholds, currency, theme, export / import
```

## The scores

| Score | Source | Formula | Default gate |
|---|---|---|---|
| Market /5 | Hormozi | mean of pain, purchasing power, easy to target, growing (1-5 each) | 3.5 |
| Value /10 | Hormozi | (dream × likelihood) ÷ (time × effort), 1-10 inputs, log-mapped to 0-10 | 6 |
| Demand /10 | Priestley + Ries | validated-vs-invalidated ratio (≤6) + pre-sales (≤4) + list size (≤3) + landing conversion (1) | 7 to recommend building |
| Traction /10 | Ries + Hormozi | weekly growth of north star, sign-up→paying conversion, LTV:CAC | growth 5%/wk, conv 2%, LTV:CAC 3× |

Thresholds are editable in Settings. The weekly metrics row is: visitors, sign-ups, activated, new paying, paying (total), churned, revenue, spend.

## Weekly rhythm

1. Open the portfolio and work the "needs you this week" list.
2. Log last week's row for every live app.
3. Call any demand test that has run three weeks.
4. Advance anything whose gate is green and write down why.
5. Pick one experiment per live app for the coming week.

## Next steps worth considering

- Pull visitors / sign-ups / revenue automatically from analytics and payment providers instead of typing them in.
- Sync the store to a hosted database so it works across devices.
