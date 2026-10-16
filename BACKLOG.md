# Backlog

Ideas for developing the dashboard, roughly in the order they are likely to matter. None are started.

## Later

- **Auto-import weekly metrics.** Fill the weekly log from payment and analytics providers (for example Stripe for revenue and paying customers, Plausible / PostHog / Google Analytics for visitors and sign-ups) instead of typing it. Per-idea source settings on the Launch tab, a "fetch this week" action on the Monitor tab, credentials kept out of the JSON export. Waiting until there are live apps with real providers to connect.
- **Weekly reminder.** A scheduled nudge on the metrics day listing which live apps have not been logged.
- **Experiment log.** One named experiment per live app per week, with a before/after on the metric it targets, so "tune the engine" has a record.
- **Compare ideas side by side.** A table view of all ideas with every score and gate state, sortable, for portfolio decisions.

## Waiting on

- **Connect the sync account.** Code, migration and instructions are in place (README → Sync across devices). Needs a Supabase project: run the migration, set the redirect URLs, set the two repository variables.

## Done

- 2026-10-16: cross-device sync layer (email-link sign-in, merge by idea, live updates), pending a Supabase project.
- 2026-10-16: hosted on GitHub Pages.
- 2026-10-16: first version. Plan, Research, Launch, Monitor, Decide; scoring, gates, recommendations; three worked examples; method guide.
