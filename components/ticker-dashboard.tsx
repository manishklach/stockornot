'use client';
/* oxlint-disable next/no-html-link-for-pages -- vinext's production Link runtime throws and breaks this interactive page. */

import { useEffect, useState } from 'react';
import { Building2, ChartLine, Factory, Flame, Search, Shuffle, Snowflake, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { NewsItem, SignalWindow, TickerIntelligence } from '@/lib/intelligence';
import type { BlendedCrowd } from '@/lib/crowd';
import type { Stock } from '@/lib/stocks';

type SearchResult = Pick<Stock, 'symbol' | 'name' | 'type'>;
type NewsBucket = 'company' | 'stock' | 'macro';

const windowLabel: Record<SignalWindow, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

const TIER_1 = new Set([
  'reuters', 'bloomberg', 'wall street journal', 'financial times', 'cnbc',
  'barron\'s', 'barrons', 'marketwatch', 'associated press',
]);
const TIER_2 = new Set([
  'cnn', 'forbes', 'fortune', 'business insider', 'yahoo finance', 'seeking alpha',
  'benzinga', 'thestreet', 'fool', 'motley fool', 'investor\'s business daily',
  'zacks', 'morningstar',
]);

function publisherTier(publisher: string): 1 | 2 | 3 {
  const key = publisher.toLowerCase().trim();
  if (TIER_1.has(key)) return 1;
  if ([...TIER_1].some((t) => key.includes(t))) return 1;
  if (TIER_2.has(key) || [...TIER_2].some((t) => key.includes(t))) return 2;
  return 3;
}

function signed(value: number | null, decimals = 1) {
  if (value === null) return '—';
  const fixed = value.toFixed(decimals);
  return `${value > 0 ? '+' : ''}${fixed}`;
}

function tone(value: number | null) {
  if (value === null) return 'text-[#9aa8b8]';
  if (value > 15) return 'text-[#5eeaa5]';
  if (value < -15) return 'text-[#ff8fa3]';
  return 'text-[#c4b5fd]';
}

function label(value: number | null) {
  if (value === null) return 'Not enough data';
  if (value > 15) return 'Positive';
  if (value < -15) return 'Negative';
  return 'Mixed';
}

function barColor(value: number | null) {
  if (value === null) return 'bg-[#334052]';
  if (value > 15) return 'bg-[#5eeaa5]';
  if (value < -15) return 'bg-[#ff8fa3]';
  return 'bg-[#a78bfa]';
}

function classify(article: NewsItem): NewsBucket {
  if (article.sourceGroup === 'macro') return 'macro';
  const text = `${article.title} ${article.reasoning ?? ''} ${article.summary ?? ''}`.toLowerCase();
  // Strong analyst/forecast signals always go to Stock.
  if (/analyst|price target|\bpt\b|upgrade|downgrade|forecast|estimates?|ratings?|outlook|guidance|consensus|initiates?(?:d)? coverage|coverage (?:initiated|assumed)|overweight|underweight|equal weight|reiterat|target (?:raised|cut|hiked|lowered|upped)|Street (?:expects|sees)/.test(text)) return 'stock';
  // Generic words (earnings, revenue, buy/sell/hold) only count as Stock when paired with an analyst context.
  const hasGeneric = /earnings|\beps\b|revenue|results|\bbuy\b|\bsell\b|\bhold\b|beat|miss/.test(text);
  const hasContext = /analyst|estimate|target|rating|consensus|forecast|outlook|guidance|earnings call|what analysts/.test(text);
  if (hasGeneric && hasContext) return 'stock';
  if (/federal reserve|fed |interest rate|rate cut|rate hike|inflation|economy|economic|industry|sector|tariff|regulation|macro|market-wide|supply chain|semiconductor|chip|software|cloud|dow jones|s&p|nasdaq|wall street|market rally|market sell/.test(text)) return 'macro';
  return 'company';
}

const bucketMeta: Record<NewsBucket, { short: string; title: string }> = {
  company: { short: 'COMPANY', title: 'Company / Fundamental News' },
  stock: { short: 'STOCK', title: 'Stock / Forecast News' },
  macro: { short: 'MACRO', title: 'Industry / Macro News' },
};

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
    score: selected.length && totalWeight ? (weightedScore / totalWeight) * 100 : null,
    positive: selected.filter((a) => a.sentiment === 'positive').length,
    neutral: selected.filter((a) => a.sentiment === 'neutral').length,
    negative: selected.filter((a) => a.sentiment === 'negative').length,
  };
}

function formatMarketCap(value: number | null) {
  if (value === null) return '—';
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

function formatFullDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'numeric', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function relativeTime(value: string, now: number) {
  const hours = Math.max(0, Math.round((now - Date.parse(value)) / 3_600_000));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function detailLine(article: NewsItem) {
  const snippet = (article.reasoning ?? article.summary ?? '').trim().replace(/\s+/g, ' ');
  const short = snippet.length > 110 ? `${snippet.slice(0, 110)}…` : snippet;
  const date = formatFullDate(article.publishedAt);
  return short ? `${short} · ${date}` : date;
}

function SignalMeter({ value }: { value: number | null }) {
  const width = value === null ? 0 : Math.min(100, Math.max(4, Math.abs(value)));
  const left = value !== null && value < 0 ? `${100 - width}%` : '0%';
  return (
    <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-[#242e3d]">
      <div className="absolute inset-y-0 left-1/2 w-px bg-[#3b4759]" />
      <div className={`absolute inset-y-0 rounded-full ${barColor(value)}`} style={{ left, width: `${width / 2}%`, ...(value !== null && value < 0 ? {} : { left: '50%' }) }} />
    </div>
  );
}

function SignalCard({ icon: Icon, title, score, count, positive, neutral, negative, emptyHint }: {
  icon: typeof Building2; title: string; score: number | null; count: number; positive: number; neutral: number; negative: number; emptyHint?: string;
}) {
  return (
    <article className="flex min-h-[168px] flex-col rounded-[12px] border border-[#232f42] bg-[#101a2a]/95 p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-[#7d8da1]" />
        <p className="text-[12.5px] font-semibold text-[#d7dde6]">{title}</p>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <strong className={`font-mono text-[36px] font-black leading-none tracking-[-0.05em] ${tone(score)}`}>{signed(score)}</strong>
        <span className={`pb-0.5 text-[12px] font-medium ${tone(score)}`}>{label(score)}</span>
      </div>
      <SignalMeter value={score} />
      <p className="mt-3 text-[11px] leading-4 text-[#8f9baa]">
        {count} {count === 1 ? 'item' : 'items'} · {positive} positive · {neutral} neutral · {negative} negative
      </p>
      {count === 0 && emptyHint && <p className="mt-1.5 text-[10.5px] leading-4 text-[#5c6878]">{emptyHint}</p>}
    </article>
  );
}

export function TickerDashboard({ stock, nextSymbol, intelligence, signalWindow, crowd }: {
  stock: Stock; nextSymbol: string; intelligence: TickerIntelligence; signalWindow: SignalWindow; crowd?: BlendedCrowd | null;
}) {
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
  const macroPool = [...intelligence.news.articles, ...(intelligence.macroExtras ?? [])];
  const macro = bucketSignal(macroPool, 'macro', signalWindow, intelligence.news.calculatedAt);
  const totalVotes = hot + not;
  const lifetimeCrowdScore = totalVotes ? ((hot - not) / totalVotes) * 100 : 0;
  // Prefer windowed blended crowd (organic window votes + StockTwits) when available.
  const crowdScore = crowd?.windowScore ?? lifetimeCrowdScore;
  const crowdTotal = crowd ? crowd.windowTotal : totalVotes;
  const hasVotes = crowd ? crowd.windowTotal >= 5 : totalVotes > 0;
  const crowdConfidence = crowd?.confidence ?? (totalVotes >= 50 ? 'Established' : totalVotes >= 10 ? 'Developing' : 'Limited');
  const seedTotal = crowd ? crowd.breakdown.seedHot + crowd.breakdown.seedNot : 0;
  const organicTotal = crowd ? crowd.breakdown.organicHot + crowd.breakdown.organicNot : 0;
  const external = crowd?.external ?? null;
  const newsScore = intelligence.news.score;
  const divergence = newsScore === null || crowdScore === null ? null : crowdScore - newsScore;
  const divergenceCopy = divergence === null
    ? 'More ticker-specific reporting is needed before the signals can be compared.'
    : Math.abs(divergence) < 15
      ? 'Crowd sentiment and the professional news environment are broadly aligned.'
      : divergence > 0
        ? 'Crowd is materially more bullish than the professional news environment.'
        : 'Crowd is materially more bearish than the professional news environment.';

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

  const profile = intelligence.profile;

  return (
    <main className="min-h-screen bg-[#08111d] text-[#f4f6fb] lg:grid lg:grid-cols-[228px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="hidden min-h-screen border-r border-[#1d2735] bg-[#0a1320] px-5 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <a href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-[9px] bg-[#8da8ff] text-sm font-black text-[#0a1320]">S</span>
          <span>
            <strong className="block text-[15px] leading-5 font-bold">StockOrNot</strong>
            <small className="block text-[11px] text-[#8b96a5]">Market information monitor</small>
          </span>
        </a>
        <nav className="mt-8 space-y-1 text-[14px]" aria-label="Main navigation">
          <a href={`/ticker/${stock.symbol.toLowerCase()}`} className="block rounded-[8px] bg-[#182232] px-3 py-2.5 font-semibold text-white">Dashboard</a>
          <a href="#recent-information" className="block rounded-[8px] px-3 py-2.5 text-[#aeb9c7] hover:bg-[#121c29] hover:text-white">Sources</a>
          <a href="/methodology" className="block rounded-[8px] px-3 py-2.5 text-[#aeb9c7] hover:bg-[#121c29] hover:text-white">Methodology</a>
          <a href="/leaderboard" className="block rounded-[8px] px-3 py-2.5 text-[#aeb9c7] hover:bg-[#121c29] hover:text-white">Leaderboard</a>
        </nav>
        <div className="mt-auto border-t border-[#1e2937] pt-4 text-[11px] leading-4 text-[#8b96a5]">
          <p className="font-semibold text-[#e6ebf2]">MVP</p>
          <p className="mt-1">News and Crowd are isolated signals.</p>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-7 lg:px-8">
          {/* Top header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8ea6c8]">Market intelligence</p>
              <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.03em]">Company Dashboard</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form className="relative" action="/search" method="get">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#7d8da1]" />
                <Input
                  name="q" value={query} onChange={(e) => updateQuery(e.target.value)}
                  placeholder={stock.symbol} aria-label="Search ticker or company" autoComplete="off"
                  className="h-9 w-[132px] rounded-[8px] border-[#2a3545] bg-[#0e1724] pl-9 text-[13px] font-bold uppercase placeholder:text-[#dce2eb]"
                />
                <button type="submit" className="sr-only">Open ticker</button>
                {query.trim() !== '' && (
                  <div className="absolute right-0 top-11 z-30 w-[320px] overflow-hidden rounded-[10px] border border-[#2a3545] bg-[#111a28] shadow-2xl">
                    {searching
                      ? <p className="px-4 py-3 text-[13px] text-[#9ca9b8]">Searching…</p>
                      : results.length
                        ? results.map((r) => (
                          <a key={r.symbol} href={`/ticker/${r.symbol.toLowerCase()}`} className="flex items-center justify-between gap-2 border-b border-[#22303f] px-4 py-2.5 text-[13px] last:border-0 hover:bg-[#182232]">
                            <span className="min-w-0 truncate"><strong className="font-mono">{r.symbol}</strong><span className="ml-2 truncate text-[#9ca9b8]">{r.name}</span></span>
                            <span className="shrink-0 text-[11px] text-[#7f8b9a]">{r.type}</span>
                          </a>
                        ))
                        : <p className="px-4 py-3 text-[13px] text-[#9ca9b8]">No matching ticker</p>}
                  </div>
                )}
              </form>
              <select
                value={signalWindow} onChange={(e) => changeWindow(e.target.value)} aria-label="Time window"
                className="h-9 cursor-pointer rounded-[8px] border border-[#2a3545] bg-[#0e1724] px-3 text-[13px] font-semibold outline-none focus:border-[#6d83bf]"
              >
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
              </select>
              <a
                href={`/ticker/${nextSymbol.toLowerCase()}`} aria-label="Open a random ticker" title="Random ticker"
                className="grid h-9 w-10 place-items-center rounded-[8px] border border-[#2a3545] bg-[#0e1724] text-[#dce2eb] hover:bg-[#182232] hover:text-white"
              >
                <Shuffle className="size-3.5" />
              </a>
            </div>
          </header>

          {/* Ticker title row */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[21px] font-bold tracking-[-0.02em]">{stock.name} ({stock.symbol})</h2>
              <p className="mt-1 text-[13px] text-[#9aa6b6]">
                {stock.type} · {profile?.industry ?? stock.sector} · {windowLabel[signalWindow]}
                {profile?.exchange ? ` · ${profile.exchange}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#2a3545] bg-[#111a28] px-3 py-1 text-[11px] text-[#aeb9c7]">
                {intelligence.news.coverage} coverage · {intelligence.news.sourceCount} {intelligence.news.sourceCount === 1 ? 'source' : 'sources'}
                {intelligence.newsStale ? ' · stale' : ''}
              </span>
              <span className="rounded-full border border-[#2a3545] bg-[#111a28] px-3 py-1 text-[11px] text-[#aeb9c7]">Live architecture, real data</span>
            </div>
          </div>

          {/* 4 signal cards */}
          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Market signals">
            <SignalCard icon={Building2} title="Company / Fundamental News" score={company.score} count={company.articles.length} positive={company.positive} neutral={company.neutral} negative={company.negative} />
            <SignalCard icon={ChartLine} title="Stock / Forecast News" score={stockNews.score} count={stockNews.articles.length} positive={stockNews.positive} neutral={stockNews.neutral} negative={stockNews.negative} emptyHint={stockNews.articles.length === 0 ? `No analyst or forecast items for ${stock.symbol} in ${windowLabel[signalWindow].toLowerCase()} — small caps often have thin coverage. Try 30 days.` : undefined} />
            <SignalCard icon={Factory} title="Industry / Macro News" score={macro.score} count={macro.articles.length} positive={macro.positive} neutral={macro.neutral} negative={macro.negative} emptyHint={macro.articles.length === 0 ? 'No macro items in this window.' : undefined} />
            <article className="flex min-h-[168px] flex-col rounded-[12px] border border-[#232f42] bg-[#101a2a]/95 p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="size-3.5 text-[#7d8da1]" />
                  <p className="text-[12.5px] font-semibold text-[#d7dde6]">Crowd Sentiment</p>
                </div>
                <span className="rounded-full bg-[#172131] px-2 py-0.5 text-[10px] font-bold text-[#8f9baa]">{crowdConfidence}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <strong className={`font-mono text-[36px] font-black leading-none tracking-[-0.05em] ${tone(hasVotes ? crowdScore : null)}`}>
                  {hasVotes ? signed(crowdScore) : '—'}
                </strong>
                <span className={`pb-0.5 text-[12px] font-medium ${tone(hasVotes ? crowdScore : null)}`}>{hasVotes ? label(crowdScore) : 'Low sample'}</span>
              </div>
              <SignalMeter value={hasVotes ? crowdScore : null} />
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[11px] text-[#8f9baa]">
                  {crowdTotal.toLocaleString()} window signals · {windowLabel[signalWindow].toLowerCase()}
                </p>
              </div>
              <p className="mt-1 text-[10.5px] leading-4 text-[#5c6878]">
                {crowd
                  ? `${organicTotal.toLocaleString()} organic votes lifetime · ${crowd.breakdown.organicWindowHot}/${crowd.breakdown.organicWindowNot} hot/not in window${external ? ` + StockTwits ${external.bull}/${external.bear} bull/bear (${external.messageCount} msgs${external.stale ? ', stale' : ''})` : ' + no external crowd yet'} · ${seedTotal.toLocaleString()} seed excluded`
                  : `${totalVotes.toLocaleString()} responses · ${hot.toLocaleString()} hot · ${not.toLocaleString()} not`}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => vote('hot')} disabled={voteState === 'saving'}
                  className={`flex-1 rounded-[7px] border px-2 py-1.5 text-[11px] font-black tracking-wide transition ${voteState === 'hot' ? 'border-[#5eeaa5] bg-[#5eeaa5]/15 text-[#5eeaa5]' : 'border-[#2f3c4f] bg-[#0d1624] text-[#c6cfdb] hover:border-[#5eeaa5] hover:text-[#5eeaa5]'} disabled:opacity-60`}
                >
                  <span className="inline-flex items-center gap-1"><Flame className="size-3" /> HOT</span>
                </button>
                <button
                  onClick={() => vote('not')} disabled={voteState === 'saving'}
                  className={`flex-1 rounded-[7px] border px-2 py-1.5 text-[11px] font-black tracking-wide transition ${voteState === 'not' ? 'border-[#ff8fa3] bg-[#ff8fa3]/15 text-[#ff8fa3]' : 'border-[#2f3c4f] bg-[#0d1624] text-[#c6cfdb] hover:border-[#ff8fa3] hover:text-[#ff8fa3]'} disabled:opacity-60`}
                >
                  <span className="inline-flex items-center gap-1"><Snowflake className="size-3" /> NOT</span>
                </button>
              </div>
              {voteError && <p className="mt-1.5 text-[11px] text-[#ff8fa3]">{voteError}</p>}
            </article>
          </section>

          {/* Divergence + architecture */}
          <section className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[12px] border border-[#232f42] bg-[#101a2a]/95 p-5 sm:p-6">
              <p className="text-[13px] font-bold text-white">Crowd vs. News Divergence</p>
              <strong className={`mt-4 block font-mono text-[52px] font-black leading-none tracking-[-0.05em] ${tone(divergence)}`}>
                {signed(divergence)}
              </strong>
              <p className="mt-3 max-w-[52ch] text-[13.5px] leading-5 text-[#c1c9d4]">{divergenceCopy}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[9px] bg-[#172131] px-4 py-3">
                  <p className="text-[11px] text-[#8f9baa]">News composite</p>
                  <strong className={`mt-1 block font-mono text-[20px] font-bold ${tone(newsScore)}`}>{signed(newsScore)}</strong>
                  <p className="mt-1 text-[10.5px] text-[#7d8a9a]">{intelligence.news.total} items · {intelligence.news.coverage}</p>
                </div>
                <div className="rounded-[9px] bg-[#172131] px-4 py-3">
                  <p className="text-[11px] text-[#8f9baa]">Crowd</p>
                  <strong className={`mt-1 block font-mono text-[20px] font-bold ${tone(hasVotes ? crowdScore : null)}`}>{hasVotes ? signed(crowdScore) : '—'}</strong>
                  <p className="mt-1 text-[10.5px] text-[#7d8a9a]">{crowdTotal.toLocaleString()} window signals · {crowdConfidence}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[12px] border border-[#232f42] bg-[#101a2a]/95 p-5 sm:p-6">
              <p className="text-[13px] font-bold text-white">Signal Architecture</p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-[10px] border border-[#2b3646] bg-[#0d1626] p-4">
                  <strong className="font-mono text-[13px] font-black tracking-wider text-[#8fb0ff]">NEWS</strong>
                  <p className="mt-1.5 text-[11.5px] leading-4 text-[#aeb9c7]">Professional and primary-source information</p>
                  <p className="mt-2 text-[10.5px] leading-4 text-[#7d8a9a]">Ticker-specific sentiment, recency-weighted. Tiers apply only to News.</p>
                </div>
                <div className="rounded-[10px] border border-[#2b3646] bg-[#0d1626] p-4">
                  <strong className="font-mono text-[13px] font-black tracking-wider text-[#d4a9ff]">CROWD</strong>
                  <p className="mt-1.5 text-[11.5px] leading-4 text-[#aeb9c7]">Investor psychology and public discussion</p>
                  <p className="mt-2 text-[10.5px] leading-4 text-[#7d8a9a]">Own Hot/Not (windowed, seed excluded) + StockTwits bull/bear. Never feeds into News.</p>
                </div>
              </div>
              <p className="mt-4 text-[11.5px] leading-4 text-[#8f9baa]">No item can exist in both groups. News tiers apply only to News.</p>
              <a href="/methodology" className="mt-2 inline-block text-[11.5px] font-semibold text-[#8fb0ff] hover:underline">How scores are built →</a>
            </article>
          </section>

          {/* Company profile details */}
          <section className="mt-3 rounded-[12px] border border-[#232f42] bg-[#101a2a]/95 p-5 sm:p-6" aria-label="Company profile">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold text-white">Company Profile</h2>
              {profile?.homepageUrl && (
                <a href={profile.homepageUrl} target="_blank" rel="noreferrer" className="text-[11.5px] font-semibold text-[#8fb0ff] hover:underline">
                  Official site ↗
                </a>
              )}
            </div>
            {profile?.description
              ? <p className="mt-3 max-w-[110ch] text-[13px] leading-5 text-[#b9c2cf]">{profile.description}</p>
              : <p className="mt-3 text-[13px] text-[#7d8a9a]">No company description available for {stock.symbol}.</p>}
            <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { k: 'Market cap', v: formatMarketCap(profile?.marketCap ?? null) },
                { k: 'Employees', v: profile?.employees ? profile.employees.toLocaleString() : '—' },
                { k: 'Exchange', v: profile?.exchange ?? stock.sector ?? '—' },
                { k: 'Currency', v: profile?.currency ?? '—' },
                { k: 'Listed', v: profile?.listDate ?? '—' },
                { k: 'Type', v: stock.type },
              ].map((f) => (
                <div key={f.k} className="rounded-[9px] bg-[#172131] px-3.5 py-2.5">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-[#7d8a9a]">{f.k}</dt>
                  <dd className="mt-1 truncate font-mono text-[13px] font-bold text-white" title={f.v}>{f.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Recent information */}
          <section id="recent-information" className="mt-3 overflow-hidden rounded-[12px] border border-[#232f42] bg-[#101a2a]/95">
            <div className="flex items-center justify-between gap-3 border-b border-[#243044] px-5 py-3.5">
              <div className="flex items-center gap-3">
                <h2 className="text-[13px] font-bold text-white">Recent Information</h2>
                <span className="hidden rounded-full bg-[#172131] px-2.5 py-0.5 text-[10.5px] text-[#8f9baa] sm:inline-block">
                  {intelligence.news.articles.length + (intelligence.macroExtras?.length ?? 0)} shown · {windowLabel[signalWindow].toLowerCase()}
                  {intelligence.macroStale ? ' · macro stale' : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10.5px] font-medium">
                <span className="inline-flex items-center gap-1.5 text-[#5eeaa5]"><span className="size-1.5 rounded-full bg-[#5eeaa5]" /> Positive</span>
                <span className="inline-flex items-center gap-1.5 text-[#aeb9c7]"><span className="size-1.5 rounded-full bg-[#8b96a5]" /> Neutral</span>
                <span className="inline-flex items-center gap-1.5 text-[#ff8fa3]"><span className="size-1.5 rounded-full bg-[#ff8fa3]" /> Negative</span>
              </div>
            </div>
            {intelligence.news.articles.length || (intelligence.macroExtras?.length ?? 0) ? (
              <ul>
                {[...intelligence.news.articles, ...(intelligence.macroExtras ?? [])]
                  .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
                  .slice(0, 14).map((article) => {
                  const bucket = classify(article);
                  const tier = publisherTier(article.publisher);
                  return (
                    <li key={article.id}>
                      <a
                        href={article.articleUrl} target="_blank" rel="noreferrer"
                        className="grid gap-1.5 border-b border-[#1e2937] px-5 py-4 transition last:border-0 hover:bg-[#152033] sm:grid-cols-[84px_minmax(0,1fr)_170px_76px] sm:items-center sm:gap-4"
                      >
                        <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#8b96a5]">{bucketMeta[bucket].short}</span>
                        <span className="min-w-0">
                          <strong className="block truncate text-[13px] font-semibold text-[#eef2f7]">{article.title}</strong>
                          <small className="mt-1 block truncate text-[11px] text-[#7d8a9a]" title={detailLine(article)}>
                            {detailLine(article)}
                          </small>
                          <small className="mt-0.5 block text-[10.5px] text-[#5c6878] sm:hidden">
                            {article.publisher} · Tier {tier} · {relativeTime(article.publishedAt, intelligence.news.calculatedAt)}
                          </small>
                        </span>
                        <span className="hidden min-w-0 sm:block">
                          <span className="block truncate text-[11px] text-[#9aa6b6]">{article.publisher} · Tier {tier}</span>
                          <span className="mt-0.5 block text-[10.5px] text-[#5c6878]">{relativeTime(article.publishedAt, intelligence.news.calculatedAt)}</span>
                        </span>
                        <span className={`text-left font-mono text-[11px] font-bold lowercase sm:text-right ${article.sentiment === 'positive' ? 'text-[#5eeaa5]' : article.sentiment === 'negative' ? 'text-[#ff8fa3]' : 'text-[#aeb9c7]'}`}>
                          {article.sentiment}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-[13px] text-[#8b96a5]">No scored ticker-specific reporting in this window. Try 7 days or 30 days.</p>
            )}
            <p className="border-t border-[#243044] bg-[#0c1522] px-5 py-2.5 text-[10.5px] leading-4 text-[#5c6878]">
              Ticker news from Massive (publisher cap 4, recency-weighted). Macro adds SPY/QQQ market proxy + GDELT industry feed — labeled MACRO, never feeds the news composite.
            </p>
          </section>

          <footer className="mt-4 flex flex-col gap-2 pb-6 text-[11px] leading-4 text-[#5c6878] sm:flex-row sm:items-center sm:justify-between">
            <p>Sentiment is not investment advice. For entertainment and discovery only.</p>
            <div className="flex gap-4">
              <a href="/methodology" className="font-semibold text-[#7d8da1] hover:text-white hover:underline">Methodology</a>
              <a href="/leaderboard" className="font-semibold text-[#7d8da1] hover:text-white hover:underline">Leaderboard</a>
              <a href={`/ticker/${nextSymbol.toLowerCase()}`} className="font-semibold text-[#7d8da1] hover:text-white hover:underline">Random ticker</a>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
