# Product roadmap

## Phase 1 — Expand the data foundation

- ✅ Move the active US common-stock and ETF universe into D1
- ✅ Use the database catalog for voting, validation, search, leaderboards, and ticker pages
- ✅ Add real ticker profiles and news sentiment with D1 caching
- ✅ Add 24-hour, 7-day, and 30-day news windows
- ✅ Add transparent crowd-versus-news divergence
- Confirm production licensing and redistribution rights for market data
- Add intraday quotes where plan entitlements and product needs support them
- Establish canonical security identifiers and delisting behavior
- Add scheduled symbol and metadata synchronization
- ✅ Add bounded server-side ticker search
- Separate seeded launch data from organic crowd sentiment

## Phase 2 — Better sentiment

- Add rolling crowd-sentiment windows alongside the existing news windows
- Show vote velocity and confidence based on sample size
- Detect sharp sentiment changes without labeling them as trade signals
- Add sector, index, and ETF-category leaderboards
- Introduce transparent anti-manipulation annotations

## Phase 3 — Retention

- Optional accounts while preserving anonymous exploration
- Watchlists and saved comparisons
- Daily personalized rating queue
- Digest notifications for watched tickers
- Shareable matchup cards and weekly community recaps

## Phase 4 — Trust and scale

- Edge rate limiting and anomaly detection
- Moderation and incident-response tooling
- Precomputed aggregate tables and event processing
- Accessibility audit, performance budgets, and product analytics
- Legal review of disclosures, data licensing, and promotional language

## Deliberately out of scope

StockOrNot should not execute trades, custody assets, provide personalized recommendations, promise returns, or sell ranking placement. Those additions would materially change the product and its compliance profile.
