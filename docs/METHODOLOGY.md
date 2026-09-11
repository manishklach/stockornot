# Scoring methodology

## Crowd signal

Windowed blended crowd for the selected 24h / 7d / 30d window:

```text
Crowd = 100 × ((organicHot + stBull) − (organicNot + stBear)) ÷ windowTotal
```

- `organicHot/Not` = D1 `votes` in the window (seed baseline excluded, shown separately)
- `stBull/Bear` = StockTwits symbol stream (last 30 messages, same window, D1-cached 30m, stale fallback)
- Result ranges −100 to +100 with one decimal. Null below 5 window signals or fewer than 2 per bucket (“Not enough data” / “Low sample”).
- Confidence: `≥50 Established`, `≥10 Developing`, else `Limited`.
- Lifetime leaderboard still ranks seed + all organic votes so new tickers sort sensibly; dashboards show the windowed blend.

## News signal

Massive supplies ticker-specific insight labels and reasoning for eligible articles. Positive maps to +1, neutral to 0, and negative to −1. StockOrNot calculates:

```text
News = 100 × Σ(sentiment × recency weight) ÷ Σ(recency weight)
```

The recency weight decays exponentially, with a half-life equal to one third of the selected window and a minimum of 12 hours. Duplicate normalized titles are removed, ticker publishers cap at four articles and macro publishers at three per window. Each bucket (Company / Stock-Forecast / Industry-Macro) requires at least two eligible articles; otherwise it reports “Not enough data” instead of an extreme ±100.

Buckets split the same window: strong analyst signals (price target, upgrade/downgrade, estimate, rating, guidance, consensus, initiations, overweight/underweight) go to Stock; generic words (earnings, revenue, buy/sell/hold) only count as Stock with analyst context; market/industry keywords go to Macro; the rest is Company. Macro is enriched with an SPY/QQQ market proxy (Massive) plus a keyless GDELT industry feed — labeled MACRO, never feeding the ticker news composite.

## Divergence

```text
Divergence = windowed Crowd − ticker News composite
```

Positive divergence means the crowd is more bullish than recent coverage; negative divergence means it is more bearish. Divergence is hidden with the crowd signal until after voting.

## Leaderboards

- **Hottest** sorts lifetime scores from highest to lowest.
- **Coldest** sorts lifetime scores from lowest to highest.
- **Divisive** sorts by distance from 50%, with the closest scores first.

Lifetime totals combine seeded baseline with live community votes so first-run ranking is useful. Per-ticker dashboards separate seed from organic and show windowed blends with confidence.

## Bias reduction

The crowd result remains hidden until after the user submits a rating. This reduces anchoring on the existing score, although it does not eliminate selection bias or coordinated behavior.

## Vote integrity

The MVP uses:

- An anonymous random identifier stored as an HTTP-only, same-site cookie
- A database uniqueness constraint per voter, ticker, and UTC day
- Upsert behavior so a repeat daily submission changes a vote rather than adds one
- Server-side symbol and rating validation
- A basic recent-vote velocity check (30/min)

These controls discourage casual duplicate voting. They are not proof of personhood and do not stop determined attackers who rotate devices, cookies, or networks.

## Instrument and news data

The database snapshot includes active US-locale instruments classified by Massive as common stock (`CS`) or exchange-traded fund (`ETF`); preferred shares, warrants, rights, bonds, ETNs, and other provider types are excluded. Company profiles and recent ticker-specific news also come from Massive. Profiles are cached for seven days, news and macro for 30 minutes, and external crowd for 30 minutes, with stale-cache fallback during temporary provider failures.

## Interpretation

The signals represent audience sentiment and news tone. They do not measure:

- Fair value or expected return
- Fundamental quality
- Risk, volatility, or drawdown potential
- Portfolio suitability
- Analyst consensus
- Regulatory or accounting quality

StockOrNot is an entertainment and discovery experience, not investment research or advice.
