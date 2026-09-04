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
  instruments.server.ts    D1-backed instrument reads and vote totals
  stocks.ts                Shared instrument types and score calculation
public/
  og.png                   Social preview image
scripts/
  seed-instruments.mjs     Massive reference-data migration generator
```

## Changing the instrument catalog

The catalog lives in the D1 `instruments` table. The checked-in snapshot contains 10,743 active US instruments: 5,317 common stocks and 5,426 ETFs.

To refresh it, generate an empty schema migration, then run `node scripts/seed-instruments.mjs drizzle/<migration>.sql`. The script requires `MASSIVE_API_KEY` in ignored `.env.local`, follows provider pagination, imports the `CS` and `ETF` types, and writes deterministic display colors and seeded sentiment totals. Review the generated SQL and counts before committing it. Never commit the API key.

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
