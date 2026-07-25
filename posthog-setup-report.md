<wizard-report>
# PostHog post-wizard report

The wizard has completed a PostHog integration for the DevEvent Next.js App Router application. PostHog is now initialized via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), with a reverse proxy configured through Next.js rewrites so events are less likely to be blocked by ad-blockers. Client-side exception autocapture is enabled. Two key user interactions are now tracked, and a dashboard with three insights has been created in PostHog.

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `explore_events_clicked` | User clicks the "Explore Events" button to scroll down to the events listing section. | `components/ExploreBtn.tsx` |
| `event_card_clicked` | User clicks on an event card to view details for a specific developer event. Properties: `event_title`, `event_slug`, `event_location`, `event_date`. | `components/EventCard.tsx` |

## Files changed

| File | Change |
|---|---|
| `instrumentation-client.ts` | Created — initializes PostHog with EU host, reverse proxy, exception autocapture, and dev-mode debug warning. |
| `next.config.ts` | Added reverse proxy rewrites for `/ingest` → `eu.i.posthog.com` and static assets. |
| `components/ExploreBtn.tsx` | Added `posthog.capture("explore_events_clicked")` in the button's click handler. |
| `components/EventCard.tsx` | Made client component; added `posthog.capture("event_card_clicked", {...})` with event metadata properties; also fixed template literal bug in the `href`. |
| `.env.local` | Created with `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`. |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics (wizard)](https://eu.posthog.com/project/232374/dashboard/848821)
- **Insight 1 – Explore Events button clicks (wizard)**: [https://eu.posthog.com/project/232374/insights/pwM0FMlZ](https://eu.posthog.com/project/232374/insights/pwM0FMlZ) — daily trend of users clicking "Explore Events".
- **Insight 2 – Event card clicks by event (wizard)**: [https://eu.posthog.com/project/232374/insights/YQc60URm](https://eu.posthog.com/project/232374/insights/YQc60URm) — which developer events get the most clicks, broken down by event title.
- **Insight 3 – Explore to event click funnel (wizard)**: [https://eu.posthog.com/project/232374/insights/JvgiGptP](https://eu.posthog.com/project/232374/insights/JvgiGptP) — conversion funnel from clicking "Explore Events" to clicking a specific event card.

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
