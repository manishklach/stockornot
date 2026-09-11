import { ArrowLeft, EyeOff, Gauge, Newspaper, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'How StockOrNot works',
  description: 'The voting, ranking, and data methodology behind StockOrNot.',
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/8">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
              S
            </span>
            <span className="font-extrabold tracking-[-0.04em]">
              STOCK<span className="text-primary">OR</span>NOT
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-5 py-12">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
          Methodology & guardrails
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-[-.05em] sm:text-5xl">
          Two signals. One transparent comparison.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          StockOrNot keeps recent news tone and community opinion separate,
          then shows where they agree or diverge. It is designed for
          discovery—not financial decision-making.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {[
            [
              EyeOff,
              'Vote before reveal',
              'We hide the crowd score until after your vote to reduce herd behavior.',
            ],
            [
              Gauge,
              'Crowd signal',
              'Windowed organic Hot/Not votes plus StockTwits bull/bear for the same window, on a −100 to +100 scale. Seed baseline is shown separately and excluded from windowed scores. Minimum 5 signals and 2+ per bucket before a score renders, with Limited / Developing / Established confidence.',
            ],
            [
              Newspaper,
              'News signal',
              'Massive supplies ticker-specific positive, neutral, or negative insights. Company, Stock/Forecast, and Industry/Macro buckets split the same window with recency weighting; macro is enriched with SPY/QQQ market proxy plus a GDELT industry feed and never feeds the news composite.',
            ],
            [
              ShieldCheck,
              'Basic vote integrity',
              'An anonymous device cookie and daily uniqueness rule limit each device to one current vote per ticker per day, with a 30-votes-per-minute velocity guard.',
            ],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof EyeOff;
            return (
              <section
                key={String(title)}
                className="rounded-2xl border border-white/8 bg-card p-6"
              >
                <I className="size-6 text-primary" />
                <h2 className="mt-8 font-black">{String(title)}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {String(copy)}
                </p>
              </section>
            );
          })}
        </div>
        <section className="mt-12 border-t border-white/8 pt-10">
          <h2 className="text-2xl font-black">Signal calculation</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/[.035] p-5">
              <p className="font-mono text-sm text-primary">Crowd = 100 × ((orgHot + stBull) − (orgNot + stBear)) ÷ windowTotal</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Organic window votes plus StockTwits bull/bear in the same 24h / 7d / 30d window. Seed baseline excluded. Null below 5 signals.</p>
            </div>
            <div className="rounded-2xl bg-white/[.035] p-5">
              <p className="font-mono text-sm text-[#83b8ff]">News = 100 × Σ(sentiment × recency weight) ÷ Σ(weight)</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Positive is +1, neutral is 0, and negative is −1. At least two scored articles per bucket; otherwise “Not enough data”.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Divergence is windowed Crowd minus ticker News composite. Headlines with duplicate normalized titles are removed; no ticker publisher contributes more than four articles and no macro publisher more than three per window.</p>
        </section>
        <section className="mt-12 border-t border-white/8 pt-10">
          <h2 className="text-2xl font-black">What the score is not</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
            <p className="rounded-xl bg-white/[.035] p-4">
              It is not a price target, analyst rating, valuation, quality
              measure, or prediction of future returns.
            </p>
            <p className="rounded-xl bg-white/[.035] p-4">
              It is not personalized to your finances, goals, time horizon,
              taxes, or tolerance for loss.
            </p>
          </div>
        </section>
        <section className="mt-10">
          <h2 className="text-2xl font-black">Data and freshness</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Company profiles and ticker-specific news come from Massive. Profiles
            are cached for seven days and news signals for 30 minutes. Industry/Macro
            adds an SPY/QQQ market proxy (Massive) plus a keyless GDELT industry feed,
            cached 30 minutes. External crowd (StockTwits symbol stream, last 30 messages,
            optional STOCKTWITS_TOKEN) is cached 30 minutes with stale fallback. If a
            provider is temporarily unavailable, StockOrNot uses the last cached
            result when one exists and labels the signal as cached or stale.
          </p>
        </section>
        <section className="mt-10 rounded-2xl border border-primary/25 bg-primary/5 p-6">
          <h2 className="font-black text-primary">Important disclaimer</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            StockOrNot is for entertainment and informational discovery only.
            Nothing here is investment advice, a recommendation, research, or an
            offer to buy or sell any security. Investing involves risk,
            including possible loss of principal.
          </p>
        </section>
      </article>
    </main>
  );
}
