# Changelog

All notable changes to StockOrNot are documented here.

## [0.5.0] - 2026-09-10

### Added

- Per-ticker intelligence dashboard with integrated Hot and Not voting
- Real company and fund profiles from Massive ticker reference data
- Ticker-specific news sentiment using Massive insights and reasoning
- Transparent recency-weighted news scoring on 24-hour, 7-day, and 30-day windows
- Crowd-versus-news divergence after voting
- Deduplicated recent-news feed with publisher concentration limits
- D1-backed profile and news-signal cache with stale-data fallback
- Database-backed ticker search and a dedicated leaderboard route

### Changed

- The home route now opens a random ticker dashboard instead of a standalone rating card
- Crowd signals use the same −100 to +100 scale as news sentiment
- Database schema is owned exclusively by versioned migrations rather than runtime DDL

### Transparency

- A minimum of two scored articles is required for a news score
- Crowd totals explicitly disclose that they include the launch baseline
- News sentiment is labeled as coverage tone, not a return forecast

## [0.4.1] — 2026-09-04

### Fixed

- Randomized the rating queue on every page load instead of presenting tickers alphabetically
- Preserved direct ticker selection when entering the rating flow from a ticker detail page

## [0.4.0] — 2026-09-04

### Added

- D1-backed catalog of 10,743 active US instruments sourced from Massive reference data
- Coverage for 5,317 common stocks and 5,426 ETFs
- Repeatable, paginated catalog import script and versioned seed migration

### Changed

- Voting validation, the rating queue, filters, search, leaderboards, and ticker detail pages now read from D1
- Vote submissions return only the updated ticker score instead of retransmitting the full score map
- Removed the hardcoded 100-symbol application catalog

### Verified

- Production build and static analysis pass
- Full score API returns all 10,743 database instruments
- A database-only ticker detail route resolves and database-only voting succeeds

## [0.3.0] — 2026-09-03

### Added

- Expanded local instrument catalog with 100 unique US-listed symbols
- Coverage across 80 stocks and 20 broad-market, style, thematic, and sector ETFs
- Deterministic seeded sentiment totals and colors for stable leaderboard behavior

### Verified

- Hot, cold, and divisive leaderboards rank the complete 100-symbol universe
- Stock and ETF filters cycle through their respective 80- and 20-symbol sets
- Search and ticker detail routes support every catalog entry

## [0.2.1] — 2026-09-03

### Changed

- Simplified the primary rating card to ticker, full company or fund name, and asset type
- Removed market charts, quotes, and provider metadata from the visible MVP
- Refocused ticker detail pages on security identity and crowd sentiment

### Notes

The market-data integration remains available for future product exploration, but the active MVP no longer requests it from the browser.

## [0.2.0] — 2026-09-03

### Added

- Provider-backed adjusted daily market history from Massive
- Interactive 5D, YTD, and 1Y chart ranges
- Latest close, period return, high/low range, volume, and market date
- Server-only provider authentication and a 15-minute D1 market-data cache
- Stale-cache fallback when the upstream provider is temporarily unavailable

### Changed

- Removed illustrative price and chart fixtures from the instrument catalog
- Updated methodology, architecture, development, and roadmap documentation

### Notes

Market bars may be delayed and are not real-time quotations. Production launch remains subject to the provider's licensing and redistribution terms.

## [0.1.0] — 2026-09-03

### Added

- Hot, Not, and Skip voting for a curated US stock and ETF universe
- Post-vote crowd sentiment reveal
- Persistent anonymous votes in Cloudflare D1
- Daily per-device ticker vote uniqueness and basic velocity protection
- Hottest, coldest, and divisive leaderboards
- Asset-type filters and ticker search
- Ticker detail pages with sentiment summaries and sample trend history
- Keyboard shortcuts and responsive interaction states
- Methodology, sample-data labeling, and financial disclaimers
- Branded social sharing metadata
- Architecture, development, methodology, roadmap, contribution, and security documentation

### Notes

Market figures in this MVP are illustrative delayed sample data. Version 0.1.0 establishes the product and platform foundation; licensed live market data is planned for the next milestone.
