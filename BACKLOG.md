# Backlog

Ideas for developing the dashboard, roughly in the order they are likely to matter. None are started.

## Later

- **Auto-import weekly metrics.** Fill the weekly log from payment and analytics providers (for example Stripe for revenue and paying customers, Plausible / PostHog / Google Analytics for visitors and sign-ups) instead of typing it. Per-idea source settings on the Launch tab, a "fetch this week" action on the Monitor tab, credentials kept out of the JSON export. Waiting until there are live apps with real providers to connect.
- **Cloud sync.** Store the data somewhere hosted (Supabase is the obvious fit) so the same ideas appear on every device and the browser can be cleared safely. Until then, Export JSON in Settings is the backup.
- **Login gate on the hosted site.** If the site ever holds synced data, put it behind Cloudflare Access or Supabase auth so only you can open it.
- **Weekly reminder.** A scheduled nudge on the metrics day listing which live apps have not been logged.
- **Experiment log.** One named experiment per live app per week, with a before/after on the metric it targets, so "tune the engine" has a record.
- **Compare ideas side by side.** A table view of all ideas with every score and gate state, sortable, for portfolio decisions.

## Done

- 2026-10-16: first version. Plan, Research, Launch, Monitor, Decide; scoring, gates, recommendations; three worked examples; method guide.
