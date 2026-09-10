# Scoring methodology

## Crowd signal

For an instrument with at least one vote:

```text
Crowd = 100 × (Hot votes − Not votes) ÷ (Hot votes + Not votes)
```

The result ranges from −100 to +100 and is rounded to the nearest whole number. The crowd signal is hidden until after the visitor votes. Totals currently combine a deterministic launch baseline with live community votes, and the interface labels this explicitly.

## News signal

Massive supplies ticker-specific insight labels and reasoning for eligible articles. Positive maps to +1, neutral to 0, and negative to −1. StockOrNot calculates:

```text
News = 100 × Σ(sentiment × recency weight) ÷ Σ(recency weight)
```

The recency weight decays exponentially, with a half-life equal to one third of the selected window and a minimum of 12 hours. Duplicate normalized titles are removed, and any single publisher contributes at most four articles. At least two eligible articles are required; otherwise the signal reports “Insufficient data.”

## Divergence

```text
Divergence = Crowd − News
```

Positive divergence means the crowd is more bullish than recent coverage; negative divergence means it is more bearish. Divergence is hidden with the crowd signal until after voting.

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

## Instrument and news data

The database snapshot includes active US-locale instruments classified by Massive as common stock (`CS`) or exchange-traded fund (`ETF`); preferred shares, warrants, rights, bonds, ETNs, and other provider types are excluded. Company profiles and recent ticker-specific news also come from Massive. Profiles are cached for seven days and news for 30 minutes, with stale-cache fallback during temporary provider failures.

## Interpretation

The signals represent audience sentiment and news tone. They do not measure:

- Fair value or expected return
- Fundamental quality
- Risk, volatility, or drawdown potential
- Portfolio suitability
- Analyst consensus
- Regulatory or accounting quality

StockOrNot is an entertainment and discovery experience, not investment research or advice.
