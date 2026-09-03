# Scoring methodology

## Hotness score

For an instrument with at least one vote:

```text
Hotness = Hot votes ÷ (Hot votes + Not votes) × 100
```

The displayed result is rounded to the nearest whole percentage. `Skip` advances the experience but is not counted as positive or negative sentiment.

## Leaderboards

- **Hottest** sorts scores from highest to lowest.
- **Coldest** sorts scores from lowest to highest.
- **Divisive** sorts by distance from 50%, with the closest scores first.

The MVP combines seeded baseline totals with live community votes. The baseline makes the first-run experience useful before a community has accumulated. A production analytics surface should identify or separate seeded and organic votes.

## Bias reduction

The crowd result remains hidden until after the user submits a rating. This reduces anchoring on the existing score, although it does not eliminate selection bias or coordinated behavior.

## Vote integrity

The MVP uses:

- An anonymous random identifier stored as an HTTP-only, same-site cookie
- A database uniqueness constraint per voter, ticker, and UTC day
- Upsert behavior so a repeat daily submission changes a vote rather than adds one
- Server-side symbol and rating validation
- A basic recent-vote velocity check

These controls discourage casual duplicate voting. They are not proof of personhood and do not stop determined attackers who rotate devices, cookies, or networks.

## Market data

Version 0.2.0 uses Massive adjusted daily aggregate bars for 5D, YTD, and 1Y charts. The displayed percentage compares the first and last adjusted close in the selected view; the high and low use the aggregate bars in that same period. Responses are cached for 15 minutes, show their latest trading date, and may be delayed. They must not be treated as real-time quotations. If the provider is temporarily unavailable, the server may return the last cached payload and label it cached.

The instrument catalog and sector labels remain curated application content. Provider availability, market holidays, corporate-action adjustments, and a user's subscription entitlements can affect the returned history. Production use must comply with the provider's licensing and redistribution terms.

## Interpretation

Hotness represents audience sentiment in this product. It does not measure:

- Fair value or expected return
- Fundamental quality
- Risk, volatility, or drawdown potential
- Portfolio suitability
- Analyst consensus
- Regulatory or accounting quality

StockOrNot is an entertainment and discovery experience, not investment research or advice.
