# Development guide

## Prerequisites

- Node.js 22.13 or newer
- npm
- A local environment capable of running the Cloudflare Workers development runtime

## Setup

```bash
npm install
npm run dev
```

The app is served at `http://localhost:3000`. Local D1 state and `.env.local` should not be committed.

## Project map

```text
app/
  api/market/[symbol]/route.ts Server-only market history and caching
  api/votes/route.ts       Vote reads, writes, validation, and aggregation
  ticker/[symbol]/page.tsx Ticker detail and metadata
  methodology/page.tsx    Public product methodology
  layout.tsx               Site-wide metadata and fonts
  page.tsx                 Main entry point
components/
  stock-app.tsx            Core client experience
  ui/                      Reusable shadcn UI primitives
db/
  schema.ts                Drizzle schema
drizzle/                   Generated SQL migrations
lib/
  stocks.ts                Typed instrument catalog and seeded totals
public/
  og.png                   Social preview image
```

## Changing the instrument catalog

Edit `lib/stocks.ts`. Every symbol must be unique and use the `Stock` or `ETF` asset type. Names, classifications, colors, and seeded sentiment totals are curated product content; price history comes from the market API.

## Changing the database

1. Update `db/schema.ts`.
2. Run `npm run db:generate`.
3. Inspect the generated SQL under `drizzle/`.
4. Confirm relevant indexes exist and add `PRAGMA optimize` after index creation when needed.
5. Run the production build.

Keep all runtime access behind the API layer and use prepared statements with bound values. Do not add browser-side direct database access.

## Quality checks

Before opening a pull request:

```bash
npm run build
npm run lint
```

Manually exercise:

1. Load the rating page and confirm score retrieval.
2. Vote Hot and Not on different symbols.
3. Confirm the score is hidden before voting and revealed afterward.
4. Switch Stocks and ETFs filters.
5. Test hottest, coldest, and divisive rankings.
6. Search for a ticker and open its detail page.
7. Open the methodology page.
8. Repeat a vote and confirm it updates rather than creating an extra daily vote.

## Product conventions

- Keep the primary vote action visible in the first viewport.
- Reveal community sentiment only after the user votes.
- Keep market prices and charts out of the core rating surface.
- Never describe crowd sentiment as investment quality or expected return.
- Preserve keyboard and touch usability together.
