'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  ExternalLink,
  Flame,
  Gauge,
  Globe2,
  Info,
  Newspaper,
  Search,
  Shuffle,
  Snowflake,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SignalWindow, TickerIntelligence } from '@/lib/intelligence';
import type { Stock } from '@/lib/stocks';

type SearchResult = Pick<Stock, 'symbol' | 'name' | 'type'>;

function signed(value: number | null) {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${value}`;
}

function signalClass(value: number | null) {
  if (value === null) return 'text-muted-foreground';
  if (value > 15) return 'text-primary';
  if (value < -15) return 'text-destructive';
  return 'text-[#ffd479]';
}

function signalLabel(value: number) {
  if (value > 15) return 'Positive';
  if (value < -15) return 'Negative';
  return 'Mixed';
}

function formatCompact(value: number | null) {
  if (value === null) return 'Not available';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function timeAgo(value: string, referenceTime: number) {
  const seconds = Math.max(1, Math.round((referenceTime - Date.parse(value)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function SignalBar({ value }: { value: number | null }) {
  const position = value === null ? 50 : (value + 100) / 2;
  return (
    <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-white/8">
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-destructive/70 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/70 to-transparent" />
      {value !== null && (
        <span
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#101a26] bg-white shadow"
          style={{ left: `${position}%` }}
        />
      )}
    </div>
  );
}

export function TickerDashboard({
  stock,
  nextSymbol,
  intelligence,
  signalWindow,
}: {
  stock: Stock;
  nextSymbol: string;
  intelligence: TickerIntelligence;
  signalWindow: SignalWindow;
}) {
  const [selectedVote, setSelectedVote] = useState<'hot' | 'not' | null>(null);
  const [hot, setHot] = useState(stock.hot);
  const [not, setNot] = useState(stock.not);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
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

  function updateQuery(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
    }
  }

  const crowdHotPercent = Math.round((hot / Math.max(1, hot + not)) * 100);
  const crowdSignal = Math.round(((hot - not) / Math.max(1, hot + not)) * 100);
  const divergence =
    intelligence.news.score === null ? null : crowdSignal - intelligence.news.score;
  const visibleDivergence = selectedVote ? divergence : null;

  const divergenceCopy = useMemo(() => {
    if (visibleDivergence === null)
      return intelligence.news.score === null
        ? 'More ticker-specific news is needed before the two signals can be compared.'
        : 'Vote to reveal how crowd opinion compares with recent news coverage.';
    if (Math.abs(visibleDivergence) < 15)
      return 'Crowd opinion and recent news coverage are broadly aligned.';
    return visibleDivergence > 0
      ? 'The crowd is materially more bullish than the recent news environment.'
      : 'The crowd is materially more bearish than the recent news environment.';
  }, [intelligence.news.score, visibleDivergence]);

  async function vote(rating: 'hot' | 'not') {
    if (selectedVote) return;
    setSelectedVote(rating);
    setNotice('');
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ symbol: stock.symbol, rating }),
      });
      const data = (await response.json()) as {
        score?: { hot: number; not: number };
        error?: string;
      };
      if (!response.ok || !data.score)
        throw new Error(data.error || 'Vote could not be saved.');
      setHot(data.score.hot);
      setNot(data.score.not);
    } catch (error) {
      setSelectedVote(null);
      setNotice(error instanceof Error ? error.message : 'Vote could not be saved.');
    }
  }

  function changeWindow(next: string) {
    const params = new URLSearchParams(window.location.search);
    params.set('window', next);
    window.location.assign(`/ticker/${stock.symbol.toLowerCase()}?${params}`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-white/8 bg-[#08111b] px-5 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link href="/" className="flex items-center gap-3" aria-label="StockOrNot home">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-black text-primary-foreground">
            S
          </span>
          <span>
            <strong className="block text-lg tracking-[-0.04em]">
              STOCK<span className="text-primary">OR</span>NOT
            </strong>
            <small className="block text-xs text-muted-foreground">Market sentiment monitor</small>
          </span>
        </Link>

        <nav className="mt-10 space-y-2 text-sm font-semibold" aria-label="Main navigation">
          <Link href={`/ticker/${stock.symbol.toLowerCase()}`} className="flex items-center gap-3 rounded-xl bg-white/7 px-4 py-3 text-foreground">
            <Gauge className="size-4 text-primary" /> Dashboard
          </Link>
          <Link href="/leaderboard" className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition hover:bg-white/4 hover:text-foreground">
            <BarChart3 className="size-4" /> Leaderboard
          </Link>
          <Link href="/methodology" className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition hover:bg-white/4 hover:text-foreground">
            <Info className="size-4" /> Methodology
          </Link>
        </nav>

        <div className="mt-auto border-t border-white/8 pt-5 text-xs leading-5 text-muted-foreground">
          <p className="font-bold text-foreground">Signals, separated.</p>
          <p className="mt-1">News tone and community opinion are calculated independently.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/8 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">S</span>
              <strong className="hidden tracking-[-0.04em] sm:block">STOCK<span className="text-primary">OR</span>NOT</strong>
            </Link>
            <div className="relative ml-auto w-full max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search ticker or company"
                aria-label="Search ticker or company"
                className="h-10 border-white/10 bg-white/5 pl-10 text-sm"
              />
              {(query || searching) && (
                <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-xl border border-white/10 bg-[#111c28] shadow-2xl">
                  {searching ? (
                    <p className="p-4 text-sm text-muted-foreground">Searching…</p>
                  ) : results.length ? (
                    results.map((result) => (
                      <Link key={result.symbol} href={`/ticker/${result.symbol.toLowerCase()}`} className="flex items-center justify-between gap-4 border-b border-white/6 px-4 py-3 text-sm last:border-0 hover:bg-white/5">
                        <span className="min-w-0">
                          <strong className="mr-2">{result.symbol}</strong>
                          <span className="truncate text-muted-foreground">{result.name}</span>
                        </span>
                        <small className="shrink-0 text-xs text-muted-foreground">{result.type}</small>
                      </Link>
                    ))
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">No matching ticker</p>
                  )}
                </div>
              )}
            </div>
            <Link href={`/ticker/${nextSymbol.toLowerCase()}`}>
              <Button variant="outline" className="h-10 shrink-0 border-white/10 bg-white/5 px-3 text-foreground sm:px-4">
                <Shuffle className="size-4" />
                <span className="hidden sm:inline">Random</span>
              </Button>
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span style={{ backgroundColor: stock.color }} className="grid size-14 shrink-0 place-items-center rounded-2xl text-lg font-black text-[#071014] sm:size-16 sm:text-xl">
                {stock.symbol.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Ticker intelligence</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-[-.045em] sm:text-4xl">{stock.name}</h1>
                  <span className="rounded-md bg-white/7 px-2 py-1 font-mono text-sm font-black">{stock.symbol}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {intelligence.profile?.industry ?? stock.type} · {intelligence.profile?.exchange ?? stock.sector}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              News window
              <select value={signalWindow} onChange={(event) => changeWindow(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-card px-3 text-sm font-bold text-foreground outline-none focus:border-primary">
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
              </select>
            </label>
          </div>

          <section className="mt-6 grid gap-3 md:grid-cols-2 2xl:grid-cols-4" aria-label="Ticker signals">
            <article className="rounded-2xl border border-white/9 bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">News sentiment</p>
                <Newspaper className="size-4 text-[#83b8ff]" />
              </div>
              <div className="mt-4 flex items-end gap-3">
                <strong className={`font-mono text-4xl ${signalClass(intelligence.news.score)}`}>{signed(intelligence.news.score)}</strong>
                <span className={`pb-1 text-sm font-bold ${signalClass(intelligence.news.score)}`}>{intelligence.news.label}</span>
              </div>
              <SignalBar value={intelligence.news.score} />
              <p className="mt-4 text-xs text-muted-foreground">{intelligence.news.total} articles · {intelligence.news.positive} positive · {intelligence.news.neutral} neutral · {intelligence.news.negative} negative</p>
            </article>

            <article className="rounded-2xl border border-white/9 bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">News coverage</p>
                <Activity className="size-4 text-[#c6a7ff]" />
              </div>
              <div className="mt-4 flex items-end gap-3">
                <strong className="font-mono text-4xl">{intelligence.news.total}</strong>
                <span className="pb-1 text-sm font-bold text-[#c6a7ff]">{intelligence.news.coverage}</span>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-[#c6a7ff]" style={{ width: `${Math.min(100, intelligence.news.total * 10)}%` }} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{intelligence.news.sourceCount} distinct publishers after deduplication</p>
            </article>

            <article className="rounded-2xl border border-white/9 bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Company scale</p>
                <Building2 className="size-4 text-[#ffd479]" />
              </div>
              <strong className="mt-4 block font-mono text-4xl">{formatCompact(intelligence.profile?.marketCap ?? null)}</strong>
              <p className="mt-2 text-sm font-bold text-[#ffd479]">Market cap</p>
              <p className="mt-7 text-xs text-muted-foreground">{formatCompact(intelligence.profile?.employees ?? null)} employees · {stock.type}</p>
            </article>

            <article className="rounded-2xl border border-primary/20 bg-[linear-gradient(145deg,rgba(185,245,69,.10),rgba(16,27,32,.96))] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Your take</p>
                <Users className="size-4 text-primary" />
              </div>
              {selectedVote ? (
                <div className="reveal-enter">
                  <div className="mt-4 flex items-end gap-3">
                    <strong className={`font-mono text-4xl ${signalClass(crowdSignal)}`}>{signed(crowdSignal)}</strong>
                    <span className={`pb-1 text-sm font-bold ${signalClass(crowdSignal)}`}>{signalLabel(crowdSignal)}</span>
                  </div>
                  <SignalBar value={crowdSignal} />
                  <p className="mt-4 text-xs text-muted-foreground">You voted {selectedVote.toUpperCase()} · {crowdHotPercent}% Hot · {(hot + not).toLocaleString()} responses including launch baseline</p>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm leading-6 text-muted-foreground">Vote before seeing the crowd signal.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button onClick={() => vote('not')} className="h-11 bg-destructive font-black text-white hover:bg-[#ff7070]"><Snowflake /> Not</Button>
                    <Button onClick={() => vote('hot')} className="h-11 font-black"><Flame /> Hot</Button>
                  </div>
                  {notice && <p className="mt-3 text-xs text-destructive">{notice}</p>}
                </div>
              )}
            </article>
          </section>

          <section className="mt-3 grid gap-3 xl:grid-cols-[1.35fr_.65fr]">
            <article className="rounded-2xl border border-white/9 bg-card p-5 sm:p-6">
              <p className="text-sm font-bold">Crowd vs. news divergence</p>
              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <strong className={`font-mono text-5xl ${signalClass(visibleDivergence)}`}>{signed(visibleDivergence)}</strong>
                  <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">{divergenceCopy}</p>
                </div>
                {!selectedVote && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary">Vote above to unlock</div>
                )}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/[.035] p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">News signal</span>
                  <strong className={`mt-2 block font-mono text-2xl ${signalClass(intelligence.news.score)}`}>{signed(intelligence.news.score)}</strong>
                </div>
                <div className="rounded-xl bg-white/[.035] p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Crowd signal</span>
                  <strong className={`mt-2 block font-mono text-2xl ${selectedVote ? signalClass(crowdSignal) : 'text-muted-foreground'}`}>{selectedVote ? signed(crowdSignal) : 'Hidden'}</strong>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-white/9 bg-card p-5 sm:p-6">
              <p className="text-sm font-bold">Company profile</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
                <div><dt>Asset</dt><dd>{stock.type}</dd></div>
                <div><dt>Currency</dt><dd>{intelligence.profile?.currency ?? '—'}</dd></div>
                <div><dt>Listed</dt><dd>{intelligence.profile?.listDate ?? '—'}</dd></div>
                <div><dt>Exchange</dt><dd>{intelligence.profile?.exchange ?? stock.sector}</dd></div>
              </dl>
              {intelligence.profile?.homepageUrl && (
                <a href={intelligence.profile.homepageUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                  <Globe2 className="size-4" /> Company website <ExternalLink className="size-3" />
                </a>
              )}
            </article>
          </section>

          {intelligence.profile?.description && (
            <section className="mt-3 rounded-2xl border border-white/9 bg-card p-5 sm:p-6">
              <h2 className="text-sm font-bold">About {stock.symbol}</h2>
              <p className="mt-3 max-w-5xl text-sm leading-7 text-muted-foreground">{intelligence.profile.description}</p>
            </section>
          )}

          <section className="mt-3 overflow-hidden rounded-2xl border border-white/9 bg-card">
            <div className="flex flex-col gap-2 border-b border-white/8 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-black">Recent information</h2>
                <p className="mt-1 text-sm text-muted-foreground">Ticker-specific headlines used in the news signal.</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-bold">
                <span className="text-primary">● Positive</span>
                <span className="text-[#aebbc7]">● Neutral</span>
                <span className="text-destructive">● Negative</span>
              </div>
            </div>
            {intelligence.news.articles.length ? (
              <div>
                {intelligence.news.articles.map((article) => (
                  <a key={article.id} href={article.articleUrl} target="_blank" rel="noreferrer" className="grid gap-3 border-b border-white/6 p-5 last:border-0 hover:bg-white/[.025] sm:grid-cols-[110px_minmax(0,1fr)_160px_90px] sm:items-center sm:px-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{article.publisher}</span>
                    <span className="min-w-0">
                      <strong className="block text-sm leading-6">{article.title}</strong>
                      {article.reasoning && <small className="mt-1 block line-clamp-1 text-xs text-muted-foreground">{article.reasoning}</small>}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-3" /> {timeAgo(article.publishedAt, intelligence.news.calculatedAt)}</span>
                    <span className={`text-xs font-bold capitalize ${article.sentiment === 'positive' ? 'text-primary' : article.sentiment === 'negative' ? 'text-destructive' : 'text-[#aebbc7]'}`}>{article.sentiment}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <Newspaper className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-3 font-bold">No scored headlines in this window</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a longer news window.</p>
              </div>
            )}
          </section>

          <footer className="mt-5 flex flex-col gap-2 border-t border-white/8 py-6 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{intelligence.newsStale ? 'Cached news signal' : 'News sentiment supplied per ticker by Massive'} · recency-weighted by StockOrNot.</p>
            <p>Sentiment is not investment advice or a forecast of returns.</p>
          </footer>
        </div>
      </div>
    </main>
  );
}
