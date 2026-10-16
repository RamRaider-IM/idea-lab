# Idea Lab

A personal dashboard for testing business ideas quickly and consistently, built on three playbooks:

- **Daniel Priestley** (Oversubscribed, Key Person of Influence): create demand before you build. Pitch, collect names and deposits, build only when people are waiting.
- **Alex Hormozi** ($100M Offers, $100M Leads): pick a starving crowd, score the value equation, build a grand slam offer, reach people through the core four channels.
- **Eric Ries** (The Lean Startup): leap-of-faith hypotheses, the MVP, innovation accounting, and a scheduled pivot-or-persevere decision.

Every idea moves through the same loop: **Plan → Research → Build & launch → Monitor → Decide**. Each phase has a gate with concrete, evidence-based criteria. The dashboard scores each idea (market, value, demand, traction), recommends scale / persevere / pivot / kill from the numbers, and keeps a decision log.

## Live site

The dashboard is hosted free on GitHub Pages at **https://ramraider-im.github.io/idea-lab/** (HTTPS enforced). Every push to `main` rebuilds and redeploys it through `.github/workflows/deploy.yml`.

The site holds no data of its own: everything you enter stays in the browser you entered it in (localStorage), so anyone else opening the URL sees an empty dashboard. Sign in (see below) to sync between devices.

## Sync across devices (optional)

Sign in with an emailed link and the same ideas follow you between laptops, phones and browsers. It runs on a free Supabase project; the app only ever touches the signed-in user's own row.

One-off setup, about five minutes:

1. **Create the table.** In the Supabase dashboard open *SQL Editor*, paste `supabase/migrations/20261016_idea_lab_state.sql` and run it. It creates `idea_lab_state`, turns on row-level security so each user can only read and write their own row, and enables live updates.
2. **Allow the sign-in link to come back to the app.** *Authentication → URL Configuration*: set *Site URL* to `https://ramraider-im.github.io/idea-lab/` and add these to *Redirect URLs*:
   - `https://ramraider-im.github.io/idea-lab/**`
   - `http://localhost:5173/**`
3. **Give the app the project's URL and publishable key.** *Project Settings → API* has both. For the hosted site, store them as repository variables so the Pages build picks them up:

   ```bash
   gh variable set VITE_SUPABASE_URL --body "https://YOUR-REF.supabase.co"
   ```

   ```bash
   gh variable set VITE_SUPABASE_KEY --body "sb_publishable_..."
   ```

   Then push any commit (or run the *Deploy to GitHub Pages* workflow) to rebuild. For local development copy `.env.example` to `.env.local` with the same values.
4. **Sign in.** *Settings & data → Sync across devices* → enter your email → open the link on that device. Repeat on each device. Whatever was already on a device is kept and merged in.

How merging works: ideas are matched by id and the most recently edited copy wins; a deleted idea leaves a tombstone so it does not come back from another device; settings come from whichever device changed them last. Supabase's built-in email sender is rate-limited to a handful of messages an hour, which is fine for signing in a few devices once.

## Run it locally

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
  sync.tsx        Supabase sign-in and two-way sync on top of the store
  merge.ts        merge rules for state from two devices
  config.ts       Supabase URL and key from env
  seed.ts         three example ideas
  components/
    SyncCard.tsx  sign-in form and sidebar sync badge
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

## Next steps

See [BACKLOG.md](BACKLOG.md).
