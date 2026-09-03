# Changelog

All notable changes to StockOrNot are documented here.

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
