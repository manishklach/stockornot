# Architecture

## Overview

StockOrNot is a React application deployed as a Cloudflare Worker through OpenAI Sites. It keeps the instrument catalog in source control, stores user-generated votes in Cloudflare D1, and loads adjusted daily market history from Massive through a server-only integration.

```text
Browser
  ├─ React voting and discovery UI
  ├─ Anonymous HTTP-only voter cookie
  ├─ GET / POST /api/votes
  └─ GET /api/market/:symbol?range=5d|ytd|1y
                 │
                 ▼
Cloudflare Worker route
  ├─ Input validation
  ├─ Duplicate and velocity checks
  ├─ Vote aggregation
  ├─ Server-only Massive request
  ├─ Market response normalization
  └─ Prepared D1 statements
           │                 │
           ▼                 ▼
Cloudflare D1             Massive API
  ├─ votes
  └─ market_cache
```

## Application surfaces

### Rating surface

`/` owns the main interaction. The client loads aggregate scores, filters the curated asset universe, submits votes, and reveals the crowd result. Search, leaderboard views, and keyboard shortcuts are kept in the same interaction surface to preserve the rapid loop.

### Ticker details

`/ticker/:symbol` renders an independently addressable ticker view with product-specific title and description metadata. Detail pages intentionally clear the generic social image because the MVP does not yet have a trustworthy ticker-specific primary image.

### Methodology

`/methodology` explains how scores are calculated, what protections exist, and what the product does not claim.

### Voting API

`/api/votes` supports:

- `GET`: initializes the database when needed and returns aggregate scores.
- `POST`: validates `{ symbol, rating }`, applies abuse controls, upserts the current daily vote, and returns refreshed scores.

### Market API

`/api/market/:symbol` validates the curated ticker and the requested `5d`, `ytd`, or `1y` range. It returns a fresh cached response when available; otherwise it requests adjusted daily aggregate bars from Massive, normalizes the payload, and stores it for 15 minutes. If an upstream request fails, the last cached response is returned and marked stale when possible.

## Data model

The `votes` table stores one current rating per anonymous voter, symbol, and UTC day.

| Column       | Purpose                                                 |
| ------------ | ------------------------------------------------------- |
| `id`         | Monotonic record identifier                             |
| `voter_key`  | Random browser identifier stored in an HTTP-only cookie |
| `symbol`     | Validated symbol from the curated catalog               |
| `rating`     | `hot` or `not`                                          |
| `vote_day`   | UTC date used for daily uniqueness                      |
| `created_at` | Epoch milliseconds for recency checks                   |

The unique index on `(voter_key, symbol, vote_day)` makes repeat submissions update the current vote instead of inflating totals. Aggregate reads use `(symbol, rating)`. A voter/time index supports basic velocity checks.

The `market_cache` table stores normalized JSON by `(symbol, range)` together with its fetch time. A fetch-time index supports future cache maintenance.

## Trust boundaries

- Browser input is untrusted. The server validates symbols and rating values.
- The anonymous cookie is an abuse-reduction mechanism, not strong identity.
- Seeded totals are application content; D1 rows are community-generated state.
- The Massive API credential exists only in the Worker environment and local ignored environment files.
- Market history is timestamped and labeled as adjusted and delayed; it is never represented as a real-time quote.
- The Worker is the only layer with direct database access.

## Deployment model

Vinext produces Cloudflare Worker-compatible ESM output. `.openai/hosting.json` declares the logical `DB` D1 binding. Migrations under `drizzle/` ship with the deployment archive and are applied by the Sites platform.

## Known scaling limits

The current aggregate query scans the relatively small vote set and groups by symbol. At larger volume, daily aggregate tables or event-to-rollup processing should replace on-request aggregation. Cookie-based identity should also be augmented by edge rate limiting and anomaly detection before opening voting to a broad public audience.
