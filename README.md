# StockOrNot

![StockOrNot — Rate the Market](public/og.png)

**A fast, playful sentiment layer for US stocks and ETFs.** Vote **Hot**, **Not**, or **Skip**, then reveal what the crowd thinks.

[Open the database-backed MVP](https://stockornot.abc123xyza.chatgpt.site)

## Why StockOrNot?

Financial products are usually presented as dense tables, expert opinions, or noisy social feeds. StockOrNot asks one deliberately simple question: _how does the crowd feel about this ticker right now?_

The product separates that sentiment signal from investment analysis. Scores are not forecasts or recommendations; they are a transparent snapshot of community mood.

## MVP features

- Rapid **Hot / Not / Skip** voting across a curated universe of US stocks and ETFs
- Crowd score revealed only after voting, reducing anchoring and herd behavior
- Persistent anonymous voting backed by Cloudflare D1
- One current vote per device, ticker, and day with server-side validation
- Hottest, coldest, and most-divisive leaderboards
- Stock and ETF filters, ticker search, and keyboard shortcuts
- Shareable ticker detail pages with accurate 5D, YTD, and 1Y adjusted price history
- Responsive, accessible interface with reduced-motion support
- Server-side Massive market-data integration with a 15-minute D1 cache
- Clear delayed-data labeling, methodology, and financial disclaimers
- Branded Open Graph and X/Twitter preview metadata

## Product loop

```text
See ticker → Vote → Reveal crowd → Explore ranking → Next ticker
```

The crowd score is intentionally hidden before a vote. After voting, the user sees the percentage of Hot votes and the total response count, then advances to another ticker.

## Technology

- React 19 and TypeScript
- Vinext and Vite
- Tailwind CSS 4
- shadcn UI primitives and Base UI
- Cloudflare Workers runtime
- Cloudflare D1 with Drizzle schema and migrations
- Massive adjusted daily aggregate market data
- OpenAI Sites for hosting

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Massive API key to `.env.local`, then open `http://localhost:3000`. The key stays on the server and must never be committed. The local Sites runtime provisions the D1 binding used by the APIs.

Useful commands:

```bash
npm run build        # Production build
npm run lint         # Static analysis
npm run format       # Format source
npm run db:generate  # Generate a migration after schema changes
```

See [Development](docs/DEVELOPMENT.md) for the complete contributor workflow.

## Data and scoring

The MVP ships with a small curated instrument catalog. Adjusted daily price bars are requested server-side from Massive for 5D, YTD, and 1Y views, timestamped in the interface, and cached in D1 for 15 minutes. They may be delayed and are not represented as real-time quotes. New crowd votes are stored persistently and combined with seeded vote totals so the initial product experience has meaningful rankings.

For ticker `t`:

```text
hotness(t) = hot_votes(t) / (hot_votes(t) + not_votes(t)) × 100
```

See [Methodology](docs/METHODOLOGY.md) for score semantics, abuse controls, and limitations.

## Architecture

The client renders the voting flow and requests aggregate scores and chart data from server routes. Voting is validated and persisted in D1. Market requests keep the provider credential server-side and cache normalized results in D1.

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

Version **0.2.0** adds provider-backed adjusted price history. The next product milestone is a broader data and identity layer: symbol synchronization, rolling sentiment windows, stronger abuse defenses, watchlists, and notification loops. Confirm production redistribution rights with the data provider before a public launch.
