# Contributing

Thanks for helping make StockOrNot clearer, faster, and more trustworthy.

## Workflow

1. Open an issue for substantial product or data-model changes.
2. Create a focused branch from `main`.
3. Keep changes small enough to review as one coherent idea.
4. Run `npm run build` and `npm run lint`.
5. Include manual test notes in the pull request.

## Pull requests

A strong pull request explains the user problem, the chosen behavior, edge cases, and how it was verified. Include images for material interface changes. Avoid mixing unrelated refactors with product work.

## Financial-product language

Do not introduce copy that promises returns, presents sentiment as research, or suggests that a crowd score is suitable for making an investment decision. Market data must include its freshness and source semantics.

## Data changes

Do not add scraped or ambiguously licensed market data. New provider integrations must document licensing assumptions, attribution requirements, request limits, timestamps, and failure behavior.

## Security reports

Please do not disclose vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md).

