'use client';
/* oxlint-disable next/no-html-link-for-pages -- vinext's production Link runtime throws and breaks this interactive page. */

import { useEffect, useState } from 'react';
import { Search, Shuffle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { NewsItem, SignalWindow, TickerIntelligence } from '@/lib/intelligence';
import type { Stock } from '@/lib/stocks';

type SearchResult = Pick<Stock, 'symbol' | 'name' | 'type'>;
type NewsBucket = 'company' | 'stock' | 'macro';

const windowLabel: Record<SignalWindow, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

function signed(value: number | null, decimals = 0) {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}`;
}

function tone(value: number | null) {
  if (value === null) return 'text-[#9aa8b8]';
  if (value > 15) return 'text-[#79e6ad]';
  if (value < -15) return 'text-[#ff7f9f]';
  return 'text-[#c5b8ff]';
}

function label(value: number | null) {
  if (value === null) return 'Not enough data';
  if (value > 15) return 'Positive';
  if (value < -15) return 'Negative';
  return 'Mixed';
}

function classify(article: NewsItem): NewsBucket {
  const text = `${article.title} ${article.reasoning ?? ''}`.toLowerCase();
  if (/analyst|price target|upgrade|downgrade|forecast|estimate|rating|outlook/.test(text)) return 'stock';
  if (/federal reserve|interest rate|inflation|economy|economic|industry|sector|tariff|regulation|macro|market-wide|supply chain/.test(text)) return 'macro';
  return 'company';
}

function bucketSignal(articles: NewsItem[], bucket: NewsBucket, signalWindow: SignalWindow, calculatedAt: number) {
  const selected = articles.filter((article) => classify(article) === bucket);
  const halfLifeHours = Math.max(12, ({ '24h': 24, '7d': 168, '30d': 720 } as const)[signalWindow] / 3);
  let totalWeight = 0;
  let weightedScore = 0;
  for (const article of selected) {
    const ageHours = Math.max(0, (calculatedAt - Date.parse(article.publishedAt)) / 3_600_000);
    const weight = 2 ** (-ageHours / halfLifeHours);
    const value = article.sentiment === 'positive' ? 1 : article.sentiment === 'negative' ? -1 : 0;
    weightedScore += value * weight;
    totalWeight += weight;
  }
  return {
    articles: selected,
    score: selected.length && totalWeight ? Math.round((weightedScore / totalWeight) * 100) : null,
    positive: selected.filter((article) => article.sentiment === 'positive').length,
    neutral: selected.filter((article) => article.sentiment === 'neutral').length,
    negative: selected.filter((article) => article.sentiment === 'negative').length,
  };
}

function SignalMeter({ value }: { value: number | null }) {
  const width = value === null ? 0 : Math.max(3, Math.abs(value));
  return (
    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#242e3d]">
      <div className={`h-full rounded-full ${value !== null && value < -15 ? 'bg-[#ff7f9f]' : value !== null && value <= 15 ? 'bg-[#b8a6ff]' : 'bg-[#79e6ad]'}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function SignalCard({ title, score, count, positive, neutral, negative }: { title: string; score: number | null; count: number; positive: number; neutral: number; negative: number }) {
  return (
    <article className="min-h-[154px] rounded-[10px] border border-[#2a3545] bg-[#111a28] p-4">
      <p className="text-[13px] font-bold text-[#e9edf4]">{title}</p>
      <div className="mt-4 flex items-end gap-2">
        <strong className={`font-mono text-[34px] font-black leading-none tracking-[-.05em] ${tone(score)}`}>{signed(score, 1)}</strong>
        <span className={`pb-0.5 text-[12px] font-semibold ${tone(score)}`}>{label(score)}</span>
      </div>
      <SignalMeter value={score} />
      <p className="mt-3 text-[11px] text-[#a1adbc]">{count} {count === 1 ? 'item' : 'items'} · {positive} positive · {neutral} neutral · {negative} negative</p>
    </article>
  );
}

function relativeTime(value: string, now: number) {
  const hours = Math.max(0, Math.round((now - Date.parse(value)) / 3_600_000));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function TickerDashboard({ stock, nextSymbol, intelligence, signalWindow }: { stock: Stock; nextSymbol: string; intelligence: TickerIntelligence; signalWindow: SignalWindow }) {
  const [hot, setHot] = useState(stock.hot);
  const [not, setNot] = useState(stock.not);
  const [voteState, setVoteState] = useState<'hot' | 'not' | 'saving' | null>(null);
  const [voteError, setVoteError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = (await response.json()) as { results?: SearchResult[] };
        setResults(data.results ?? []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const company = bucketSignal(intelligence.news.articles, 'company', signalWindow, intelligence.news.calculatedAt);
  const stockNews = bucketSignal(intelligence.news.articles, 'stock', signalWindow, intelligence.news.calculatedAt);
  const macro = bucketSignal(intelligence.news.articles, 'macro', signalWindow, intelligence.news.calculatedAt);
  const crowdScore = Math.round(((hot - not) / Math.max(1, hot + not)) * 100);
  const divergence = intelligence.news.score === null ? null : crowdScore - intelligence.news.score;
  const divergenceCopy = divergence === null
    ? 'More ticker-specific reporting is needed before the signals can be compared.'
    : Math.abs(divergence) < 15
      ? 'Crowd sentiment and the professional news environment are broadly aligned.'
      : divergence > 0
        ? 'Crowd sentiment is materially more bullish than the professional news environment.'
        : 'Crowd sentiment is materially more bearish than the professional news environment.';

  function updateQuery(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
    }
  }

  function changeWindow(next: string) {
    window.location.assign(`/ticker/${stock.symbol.toLowerCase()}?window=${next}`);
  }

  async function vote(rating: 'hot' | 'not') {
    if (voteState === 'saving') return;
    setVoteState('saving');
    setVoteError('');
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ symbol: stock.symbol, rating }),
      });
      const data = (await response.json()) as { score?: { hot: number; not: number }; error?: string };
      if (!response.ok || !data.score) throw new Error(data.error || 'Vote could not be saved.');
      setHot(data.score.hot);
      setNot(data.score.not);
      setVoteState(rating);
    } catch (error) {
      setVoteState(null);
      setVoteError(error instanceof Error ? error.message : 'Vote could not be saved.');
    }
  }

  return (
    <main className="min-h-screen bg-[#08111d] text-[#f4f6fb] lg:grid lg:grid-cols-[226px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-[#202a38] bg-[#09121e] px-5 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <a href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-[9px] bg-[#8da8ff] text-sm font-black text-[#0a1320]">S</span>
          <span><strong className="block text-[15px] leading-5">StockOrNot</strong><small className="block text-[11px] text-[#9ca9b8]">Market information monitor</small></span>
        </a>
        <nav className="mt-8 space-y-1 text-[14px]" aria-label="Main navigation">
          <a href={`/ticker/${stock.symbol.toLowerCase()}`} className="block rounded-[7px] bg-[#182232] px-3 py-2.5 font-semibold">Dashboard</a>
          <a href="#recent-information" className="block rounded-[7px] px-3 py-2.5 text-[#c2cad6] hover:bg-[#121c29]">Sources</a>
          <a href="/methodology" className="block rounded-[7px] px-3 py-2.5 text-[#c2cad6] hover:bg-[#121c29]">Methodology</a>
          <a href="/leaderboard" className="block rounded-[7px] px-3 py-2.5 text-[#c2cad6] hover:bg-[#121c29]">Leaderboard</a>
        </nav>
        <div className="mt-auto border-t border-[#26303e] pt-4 text-[11px] leading-4 text-[#9ca9b8]">
          <p className="font-semibold text-[#f0f3f8]">MVP</p>
          <p className="mt-1">News and crowd are isolated signals. Sentiment is not a return forecast.</p>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-7 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#9db7e8]">Market intelligence</p><h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-.04em]">Company Dashboard</h1></div>
            <div className="flex flex-wrap items-center gap-2">
              <form className="relative" action="/search" method="get">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8997a8]" />
                <Input name="q" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder={stock.symbol} aria-label="Search ticker or company" autoComplete="off" className="h-9 w-[138px] rounded-[7px] border-[#2a3545] bg-[#0e1724] pl-9 text-[13px] font-semibold" />
                <button type="submit" className="sr-only">Open ticker</button>
                {query && (
                  <div className="absolute right-0 top-11 z-30 w-[300px] overflow-hidden rounded-[8px] border border-[#2a3545] bg-[#111a28] shadow-2xl">
                    {searching ? <p className="px-4 py-3 text-[13px] text-[#9ca9b8]">Searching…</p> : results.length ? results.map((result) => (
                      <a key={result.symbol} href={`/ticker/${result.symbol.toLowerCase()}`} className="flex items-center justify-between border-b border-[#26303e] px-4 py-3 text-[13px] last:border-0 hover:bg-[#182232]">
                        <span className="min-w-0 truncate"><strong>{result.symbol}</strong> <span className="ml-2 text-[#9ca9b8]">{result.name}</span></span><span className="ml-3 text-[11px] text-[#7f8b9a]">{result.type}</span>
                      </a>
                    )) : <p className="px-4 py-3 text-[13px] text-[#9ca9b8]">No matching ticker</p>}
                  </div>
                )}
              </form>
              <select value={signalWindow} onChange={(event) => changeWindow(event.target.value)} className="h-9 rounded-[7px] border border-[#2a3545] bg-[#0e1724] px-3 text-[13px] font-semibold outline-none focus:border-[#6d83bf]">
                <option value="24h">24 hours</option><option value="7d">7 days</option><option value="30d">30 days</option>
              </select>
              <a href={`/ticker/${nextSymbol.toLowerCase()}`} aria-label="Open a random ticker" className="grid h-9 w-10 place-items-center rounded-[7px] border border-[#2a3545] bg-[#0e1724] text-[#dce2eb] hover:bg-[#182232] hover:text-white"><Shuffle className="size-3.5" /></a>
            </div>
          </header>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-[20px] font-bold tracking-[-.03em]">{stock.name} ({stock.symbol})</h2><p className="mt-0.5 text-[13px] text-[#a7b1bf]">{intelligence.profile?.industry ?? stock.type} · {windowLabel[signalWindow]}</p></div>
            <span className="w-fit rounded-full border border-[#2a3545] bg-[#111a28] px-3 py-1 text-[11px] text-[#b2bdca]">Live architecture, real data</span>
          </div>

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Market signals">
            <SignalCard title="Company / Fundamental News" score={company.score} count={company.articles.length} positive={company.positive} neutral={company.neutral} negative={company.negative} />
            <SignalCard title="Stock / Forecast News" score={stockNews.score} count={stockNews.articles.length} positive={stockNews.positive} neutral={stockNews.neutral} negative={stockNews.negative} />
            <SignalCard title="Industry / Macro News" score={macro.score} count={macro.articles.length} positive={macro.positive} neutral={macro.neutral} negative={macro.negative} />
            <article className="min-h-[154px] rounded-[10px] border border-[#2a3545] bg-[#111a28] p-4">
              <p className="text-[13px] font-bold text-[#e9edf4]">Crowd Sentiment</p>
              <div className="mt-4 flex items-end gap-2"><strong className={`font-mono text-[34px] font-black leading-none tracking-[-.05em] ${tone(crowdScore)}`}>{signed(crowdScore, 1)}</strong><span className={`pb-0.5 text-[12px] font-semibold ${tone(crowdScore)}`}>{label(crowdScore)}</span></div>
              <SignalMeter value={crowdScore} />
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[11px] text-[#a1adbc]">{(hot + not).toLocaleString()} responses</p>
                <div className="flex gap-1.5">
                  <button onClick={() => vote('not')} disabled={voteState === 'saving'} className={`rounded-[5px] border px-2 py-1 text-[10px] font-bold ${voteState === 'not' ? 'border-[#ff7f9f] bg-[#ff7f9f]/15 text-[#ff9bb4]' : 'border-[#344052] text-[#aeb8c6] hover:border-[#ff7f9f]'}`}>NOT</button>
                  <button onClick={() => vote('hot')} disabled={voteState === 'saving'} className={`rounded-[5px] border px-2 py-1 text-[10px] font-bold ${voteState === 'hot' ? 'border-[#79e6ad] bg-[#79e6ad]/15 text-[#79e6ad]' : 'border-[#344052] text-[#aeb8c6] hover:border-[#79e6ad]'}`}>HOT</button>
                </div>
              </div>
              {voteError && <p className="mt-1 text-[10px] text-[#ff7f9f]">{voteError}</p>}
            </article>
          </section>

          <section className="mt-3 grid gap-3 xl:grid-cols-[1.08fr_.92fr]">
            <article className="rounded-[10px] border border-[#2a3545] bg-[#111a28] p-4">
              <p className="text-[13px] font-bold">Crowd vs. News Divergence</p>
              <strong className={`mt-6 block font-mono text-[42px] font-black leading-none tracking-[-.05em] ${tone(divergence)}`}>{signed(divergence, 1)}</strong>
              <p className="mt-3 text-[13px] leading-5 text-[#c1c9d4]">{divergenceCopy}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[7px] bg-[#172131] px-3 py-2"><p className="text-[10px] text-[#9ca9b8]">News composite</p><strong className="mt-0.5 block font-mono text-[17px]">{signed(intelligence.news.score, 1)}</strong></div>
                <div className="rounded-[7px] bg-[#172131] px-3 py-2"><p className="text-[10px] text-[#9ca9b8]">Crowd</p><strong className="mt-0.5 block font-mono text-[17px]">{signed(crowdScore, 1)}</strong></div>
              </div>
            </article>

            <article className="rounded-[10px] border border-[#2a3545] bg-[#111a28] p-4">
              <p className="text-[13px] font-bold">Signal Architecture</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-[8px] border border-[#2b3646] p-3"><strong className="text-[14px] text-[#9db7ff]">NEWS</strong><p className="mt-1 text-[11px] leading-4 text-[#b8c2cf]">Ticker-specific reporting and publisher sentiment from Massive.</p></div>
                <div className="rounded-[8px] border border-[#2b3646] p-3"><strong className="text-[14px] text-[#d4a9ff]">CROWD</strong><p className="mt-1 text-[11px] leading-4 text-[#b8c2cf]">Community Hot or Not votes, kept separate from news.</p></div>
              </div>
              <p className="mt-3 text-[11px] leading-4 text-[#a4afbd]">No vote affects the news score. News sentiment is recency-weighted and is not a price forecast.</p>
            </article>
          </section>

          <section id="recent-information" className="mt-3 overflow-hidden rounded-[10px] border border-[#2a3545] bg-[#111a28]">
            <div className="flex items-center justify-between border-b border-[#293443] px-4 py-3"><h2 className="text-[13px] font-bold">Recent Information</h2><div className="hidden gap-3 text-[10px] sm:flex"><span className="text-[#79e6ad]">● Positive</span><span className="text-[#b8c2cf]">● Neutral</span><span className="text-[#ff7f9f]">● Negative</span></div></div>
            {intelligence.news.articles.length ? (
              <div>{intelligence.news.articles.slice(0, 8).map((article) => (
                <a key={article.id} href={article.articleUrl} target="_blank" rel="noreferrer" className="grid gap-2 border-b border-[#26303e] px-4 py-3 last:border-0 hover:bg-[#151f2e] sm:grid-cols-[82px_minmax(0,1fr)_150px_72px] sm:items-center">
                  <span className="text-[10px] font-bold uppercase text-[#a6b1bf]">{classify(article)}</span>
                  <span className="min-w-0"><strong className="block truncate text-[12px] font-semibold text-[#edf1f6]">{article.title}</strong><small className="mt-0.5 block text-[10px] text-[#8f9baa]">{relativeTime(article.publishedAt, intelligence.news.calculatedAt)}</small></span>
                  <span className="truncate text-[10px] text-[#a5afbc]">{article.publisher}</span>
                  <span className={`text-[10px] font-semibold capitalize ${article.sentiment === 'positive' ? 'text-[#79e6ad]' : article.sentiment === 'negative' ? 'text-[#ff7f9f]' : 'text-[#b8c2cf]'}`}>{article.sentiment}</span>
                </a>
              ))}</div>
            ) : <p className="px-4 py-8 text-center text-[13px] text-[#9ca9b8]">No scored ticker-specific reporting in this window.</p>}
          </section>
        </div>
      </section>
    </main>
  );
}
