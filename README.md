# StockOrNot

![StockOrNot — Rate the Market](public/og.png)

**A per-ticker intelligence dashboard for US stocks and ETFs.** Compare recent news tone with community opinion, vote **Hot** or **Not**, and reveal where the signals diverge.

[Open the database-backed MVP](https://stockornot.abc123xyza.chatgpt.site)

## Why StockOrNot?

Financial products are usually presented as dense tables, expert opinions, or noisy social feeds. StockOrNot separates two simpler questions: _what is the recent news environment saying, and how does the crowd feel?_

The product separates that sentiment signal from investment analysis. Scores are not forecasts or recommendations; they are a transparent snapshot of community mood.

## MVP features

- Per-ticker intelligence dashboards across a database-backed universe of 10,743 active US stocks and ETFs
- Real company or fund profiles and ticker-specific news from Massive
- Transparent news sentiment on 24-hour, 7-day, and 30-day windows
- Integrated **Hot / Not** voting with crowd score revealed only after voting
- Crowd-versus-news divergence on a shared −100 to +100 scale
- Deduplicated recent headlines, ticker-specific sentiment reasoning, and coverage quality
- D1-backed profile and news cache with stale-data fallback
- Persistent anonymous voting backed by Cloudflare D1
- One current vote per device, ticker, and day with server-side validation
- Hottest, coldest, and most-divisive leaderboards
- Database-backed ticker search and random discovery
- Shareable ticker dashboards with product-specific metadata
- Responsive, accessible interface with reduced-motion support
- Clear methodology and financial disclaimers
- Branded Open Graph and X/Twitter preview metadata

## Product loop

```text
Open ticker → Read profile and news signal → Vote → Reveal crowd and divergence → Explore another ticker
```

News sentiment is visible independently. The crowd score and divergence remain hidden until the user votes, reducing anchoring on existing community opinion.

## Technology

- React 19 and TypeScript
- Vinext and Vite
- Tailwind CSS 4
- shadcn UI primitives and Base UI
- Cloudflare Workers runtime
- Cloudflare D1 with Drizzle schema and migrations
- OpenAI Sites for hosting

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The local Sites runtime provisions the D1 binding used by the voting API.

Useful commands:

```bash
npm run build        # Production build
npm run lint         # Static analysis
npm run format       # Format source
npm run db:generate  # Generate a migration after schema changes
```

See [Development](docs/DEVELOPMENT.md) for the complete contributor workflow.

## Data and scoring

The MVP ships with a D1 catalog snapshot of 5,317 common stocks and 5,426 ETFs sourced from Massive's active US ticker reference data. Massive also supplies ticker profiles, recent news, and ticker-specific positive, neutral, or negative insights. StockOrNot deduplicates headlines, limits publisher concentration, and applies exponential recency weighting.

For ticker `t`:

```text
crowd(t) = 100 × (hot_votes(t) − not_votes(t)) / total_votes(t)
news(t)  = 100 × Σ(sentiment × recency_weight) / Σ(recency_weight)
divergence(t) = crowd(t) − news(t)
```

See [Methodology](docs/METHODOLOGY.md) for score semantics, abuse controls, and limitations.

## Architecture

Server-rendered ticker dashboards combine the D1 instrument and vote data with cached Massive profile and news intelligence. Client interactions handle voting, search, time-window changes, and random discovery.

See [Architecture](docs/ARCHITECTURE.md) for the system boundaries, data model, and request flow.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Development guide](docs/DEVELOPMENT.md)
- [Scoring methodology](docs/METHODOLOGY.md)
- [Product roadmap](docs/ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Important disclaimer

StockOrNot is for entertainment and informational discovery only. Nothing in the application is investment advice, research, a recommendation, or an offer to buy or sell a security. Investing involves risk, including possible loss of principal.

## Project status

Version **0.5.0** introduces the ticker intelligence dashboard, real news sentiment, integrated voting, and crowd-versus-news divergence. The next milestone is scheduled catalog synchronization, organic-only crowd rollups, and stronger abuse defenses.
