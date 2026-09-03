# Changelog

All notable changes to StockOrNot are documented here.

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
