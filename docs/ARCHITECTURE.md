# Architecture

## Overview

StockOrNot is a React application deployed as a Cloudflare Worker through OpenAI Sites. It stores the instrument catalog, user-generated votes, and intelligence cache in Cloudflare D1. Massive supplies ticker profiles and ticker-specific news insights through a server-only integration.

```text
Browser
  ├─ Per-ticker intelligence dashboard
  ├─ Integrated voting, ticker search, and time-window controls
  ├─ Anonymous HTTP-only voter cookie
  ├─ GET /api/search
  └─ POST /api/votes
                 │
                 ▼
Cloudflare Worker route
  ├─ Input validation
  ├─ Duplicate and velocity checks
  ├─ Vote aggregation and divergence calculation
  ├─ Massive profile/news normalization
  ├─ Recency weighting, deduplication, and publisher caps
  └─ Prepared D1 statements
           │                 │
           ▼                 ▼
Cloudflare D1             Massive API
  ├─ instruments
  ├─ votes
  ├─ intelligence_cache
  └─ market_cache
```

## Application surfaces

### Ticker dashboard

`/` chooses a random active instrument and redirects to `/ticker/:symbol`. The ticker dashboard combines identity, profile, news sentiment, coverage, voting, crowd-versus-news divergence, and recent headlines. The crowd signal remains hidden until the current visitor votes.

### Leaderboard and discovery

`/leaderboard` renders database-ranked hottest, coldest, and most-divisive instruments. `/api/search` performs bounded symbol and company-name lookup without sending the complete catalog to the browser.

### Methodology

`/methodology` explains how scores are calculated, what protections exist, and what the product does not claim.

### Voting API

`/api/votes` supports:

- `GET`: returns aggregate scores for compatibility and diagnostics.
- `POST`: validates `{ symbol, rating }`, applies abuse controls, upserts the current daily vote, and returns refreshed scores.

### Market API

`/api/market/:symbol` remains available for future experiments but is not requested by the MVP interface. It validates symbols against D1 before any provider request.

## Data model

The `instruments` table stores the current catalog snapshot, including symbol, name, asset type, provider type, exchange, currency, active status, display color, seeded baseline totals, and source timestamps. Its indexes support active type/symbol traversal and name lookup.

The `votes` table stores one current rating per anonymous voter, symbol, and UTC day.

| Column       | Purpose                                                 |
| ------------ | ------------------------------------------------------- |
| `id`         | Monotonic record identifier                             |
| `voter_key`  | Random browser identifier stored in an HTTP-only cookie |
| `symbol`     | Validated symbol from the D1 instrument catalog          |
| `rating`     | `hot` or `not`                                          |
| `vote_day`   | UTC date used for daily uniqueness                      |
| `created_at` | Epoch milliseconds for recency checks                   |

The unique index on `(voter_key, symbol, vote_day)` makes repeat submissions update the current vote instead of inflating totals. Aggregate reads use `(symbol, rating)`. A voter/time index supports basic velocity checks.

The `market_cache` table stores normalized JSON by `(symbol, range)` together with its fetch time. A fetch-time index supports future cache maintenance.

The `intelligence_cache` table stores normalized profile and news-signal payloads by `(symbol, kind)`. Profiles remain fresh for seven days; news signals remain fresh for 30 minutes. Stale cached values are returned when an upstream refresh fails.

## Trust boundaries

- Browser input is untrusted. The server validates symbols and rating values.
- The anonymous cookie is an abuse-reduction mechanism, not strong identity.
- Seeded totals and catalog rows are versioned application content; vote rows are community-generated state.
- The Massive API credential exists only in the Worker environment and local ignored environment files.
- Provider URLs are restricted to HTTP or HTTPS before rendering.
- News tone is represented as sentiment, never as a forecast or recommendation.
- The Worker is the only layer with direct database access.

## Deployment model

Vinext produces Cloudflare Worker-compatible ESM output. `.openai/hosting.json` declares the logical `DB` D1 binding. Migrations under `drizzle/` ship with the deployment archive and are applied by the Sites platform.

## Known scaling limits

Vote aggregation is still performed on request and the crowd totals include a deterministic launch baseline. The next scaling step is an organic-only rollup table with time windows and confidence metrics. Cookie-based identity should also be augmented by edge rate limiting and anomaly detection before opening voting broadly.
