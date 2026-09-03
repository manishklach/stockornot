'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Flame, Info,
  Search, Snowflake, Sparkles, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stock, score as baseScore, stocks } from '@/lib/stocks';

type Scores = Record<string, { hot: number; not: number; score: number; total: number }>;
type Vote = 'hot' | 'not';
type Filter = 'All' | 'Stocks' | 'ETFs';
type Board = 'hot' | 'cold' | 'divisive';

function Sparkline({ stock, compact = false }: { stock: Stock; compact?: boolean }) {
  const min = Math.min(...stock.history);
  const max = Math.max(...stock.history);
  const points = stock.history.map((value, index) => {
    const x = (index / (stock.history.length - 1)) * 660;
    const y = 166 - ((value - min) / Math.max(max - min, 1)) * 135;
    return `${x},${y}`;
  }).join(' ');
  const positive = stock.history.at(-1)! >= stock.history[0];
  return (
    <svg viewBox="0 0 660 180" className={compact ? 'h-10 w-24' : 'relative z-10 h-full w-full'} role="img" aria-label={`${stock.symbol} five day ${positive ? 'upward' : 'downward'} sample trend`}>
      <polyline points={points} fill="none" stroke={positive ? 'var(--primary)' : 'var(--destructive)'} strokeWidth={compact ? 11 : 5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Mark({ stock, small = false }: { stock: Stock; small?: boolean }) {
  return <span style={{ backgroundColor: stock.color }} className={`grid shrink-0 place-items-center font-black text-[#071014] ${small ? 'size-10 rounded-xl text-[11px]' : 'size-14 rounded-2xl text-lg'}`}>{stock.symbol.slice(0, 2)}</span>;
}

export function StockApp() {
  const [filter, setFilter] = useState<Filter>('All');
  const [board, setBoard] = useState<Board>('hot');
  const [index, setIndex] = useState(0);
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);
  const [scores, setScores] = useState<Scores>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/votes').then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setScores(data.scores)).catch(() => setNotice('Live voting is reconnecting. You can still browse.'));
    const requested = new URLSearchParams(window.location.search).get('ticker')?.toUpperCase();
    const requestedIndex = stocks.findIndex((stock) => stock.symbol === requested);
    if (requestedIndex >= 0) setIndex(requestedIndex);
  }, []);

  const filtered = useMemo(() => stocks.filter((stock) => filter === 'All' || (filter === 'Stocks' ? stock.type === 'Stock' : stock.type === 'ETF')), [filter]);
  const current = filtered[index % filtered.length];
  const currentScore = scores[current.symbol] ?? { hot: current.hot, not: current.not, score: baseScore(current), total: current.hot + current.not };

  const next = useCallback(() => {
    setIndex((value) => (value + 1) % filtered.length);
    setSelectedVote(null);
    setNotice('');
  }, [filtered.length]);

  const vote = useCallback(async (rating: Vote) => {
    if (selectedVote) return;
    setSelectedVote(rating);
    try {
      const response = await fetch('/api/votes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ symbol: current.symbol, rating }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Vote could not be saved.');
      setScores(data.scores);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Vote could not be saved.');
    }
  }, [current.symbol, selectedVote]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); return; }
      if (searchOpen || event.target instanceof HTMLInputElement) return;
      if (event.key.toLowerCase() === 'h') vote('hot');
      if (event.key.toLowerCase() === 'n') vote('not');
      if (event.key.toLowerCase() === 's' || event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, searchOpen, vote]);

  const leaderboard = useMemo(() => [...stocks].sort((a, b) => {
    const sa = scores[a.symbol]?.score ?? baseScore(a);
    const sb = scores[b.symbol]?.score ?? baseScore(b);
    if (board === 'cold') return sa - sb;
    if (board === 'divisive') return Math.abs(sa - 50) - Math.abs(sb - 50);
    return sb - sa;
  }).slice(0, 5), [board, scores]);

  const matches = stocks.filter((stock) => `${stock.symbol} ${stock.name}`.toLowerCase().includes(query.toLowerCase()));
  const positive = current.change >= 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-2" aria-label="StockOrNot home"><span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">S</span><span className="text-[17px] font-extrabold tracking-[-0.04em]">STOCK<span className="text-primary">OR</span>NOT</span></a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex" aria-label="Main navigation"><a className="text-foreground" href="#rate">Rate</a><a className="transition hover:text-foreground" href="#leaderboard">Leaderboard</a><a className="transition hover:text-foreground" href="/methodology">How it works</a></nav>
          <Button onClick={() => setSearchOpen(true)} variant="outline" className="h-9 border-white/10 bg-white/5 px-4 text-foreground"><Search data-icon="inline-start" /><span className="hidden sm:inline">Find a ticker</span><span className="hidden rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline">⌘K</span></Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><span className="inline-block size-2 animate-pulse rounded-full bg-primary" /> Crowd sentiment · open now</div><h1 className="max-w-2xl text-3xl font-black tracking-[-0.045em] sm:text-4xl">Rate the market. See the pulse.</h1></div>
          <div className="flex rounded-xl bg-white/5 p-1" aria-label="Asset filter">
            {(['All', 'Stocks', 'ETFs'] as Filter[]).map((option) => <button key={option} onClick={() => { setFilter(option); setIndex(0); setSelectedVote(null); }} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${filter === option ? 'bg-white text-[#071014]' : 'text-muted-foreground hover:text-foreground'}`}>{option}</button>)}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section id="rate" aria-labelledby="rate-heading">
            <div className="mb-3 flex items-center justify-between"><h2 id="rate-heading" className="text-sm font-bold">Today&apos;s market mix</h2><p className="font-mono text-xs text-muted-foreground">{(index % filtered.length) + 1} / {filtered.length}</p></div>
            <article key={current.symbol} className="stock-enter overflow-hidden rounded-[28px] border border-white/10 bg-card shadow-[0_30px_100px_rgba(0,0,0,.28)]">
              <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-5 sm:px-8">
                <a href={`/ticker/${current.symbol.toLowerCase()}`} className="group flex min-w-0 items-center gap-4"><Mark stock={current} /><span className="min-w-0"><span className="flex items-center gap-2"><strong className="text-2xl font-black tracking-tight group-hover:text-primary">{current.symbol}</strong><span className="rounded-md bg-white/7 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{current.type}</span></span><span className="block truncate text-sm text-muted-foreground">{current.name}</span></span></a>
                <div className="shrink-0 text-right"><p className="font-mono text-lg font-bold sm:text-xl">${current.price.toFixed(2)}</p><p className={`flex items-center justify-end gap-1 text-sm font-bold ${positive ? 'text-primary' : 'text-destructive'}`}>{positive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}{Math.abs(current.change).toFixed(2)}%</p></div>
              </div>

              <div className="grid gap-8 p-5 sm:p-8 md:grid-cols-[1fr_220px]">
                <div><div className="mb-4 flex items-center justify-between text-xs text-muted-foreground"><span>5 day sample movement</span><span>Delayed demo data</span></div><div className="relative h-52 overflow-hidden rounded-2xl bg-[#0a1519] p-5"><div className="chart-grid absolute inset-0" /><Sparkline stock={current} /><span className={`absolute bottom-4 left-5 font-mono text-xs font-bold ${positive ? 'text-primary' : 'text-destructive'}`}>{positive ? '+' : '−'}{Math.abs(current.change * 2.1).toFixed(2)}% / 5D</span></div></div>
                <dl className="grid grid-cols-2 gap-x-5 gap-y-5 self-center md:grid-cols-1"><div><dt>Sector</dt><dd>{current.sector}</dd></div><div><dt>{current.type === 'ETF' ? 'Fund size' : 'Market cap'}</dt><dd>{current.marketCap}</dd></div><div><dt>Sample volume</dt><dd>{current.volume}</dd></div><div><dt>52-week range</dt><dd>{current.range}</dd></div></dl>
              </div>

              <div className="border-t border-white/8 bg-black/10 p-5 sm:px-8">
                {selectedVote ? (
                  <div className="reveal-enter" aria-live="polite"><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-bold">You voted <span className={selectedVote === 'hot' ? 'text-primary' : 'text-destructive'}>{selectedVote.toUpperCase()}</span></p><p className="text-xs text-muted-foreground">The crowd is {currentScore.score >= 50 ? 'feeling the heat' : 'staying cool'} on {current.symbol}.</p></div><strong className="font-mono text-3xl text-primary">{currentScore.score}%</strong></div><div className="mb-5 flex h-3 overflow-hidden rounded-full bg-destructive"><span className="bg-primary transition-all duration-700" style={{ width: `${currentScore.score}%` }} /></div><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{currentScore.total.toLocaleString()} total votes</span><Button onClick={next} className="h-11 px-5">Next {filtered[(index + 1) % filtered.length].symbol}<ArrowRight data-icon="inline-end" /></Button></div></div>
                ) : (
                  <><div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3"><Button aria-label={`Vote not on ${current.symbol}`} onClick={() => vote('not')} className="h-14 bg-[#ff5757] text-base font-black text-white hover:bg-[#ff6d6d]"><Snowflake className="size-5" /><span className="hidden sm:inline">NOT</span><span className="hidden rounded border border-white/20 px-1.5 font-mono text-[10px] md:inline">N</span></Button><Button aria-label="Skip this stock" onClick={next} variant="ghost" className="h-14 px-3 text-muted-foreground sm:px-4">Skip <span className="hidden font-mono text-[10px] md:inline">S</span></Button><Button aria-label={`Vote hot on ${current.symbol}`} onClick={() => vote('hot')} className="h-14 text-base font-black"><Flame className="size-5" /><span className="hidden sm:inline">HOT</span><span className="hidden rounded border border-black/20 px-1.5 font-mono text-[10px] md:inline">H</span></Button></div><p className="mt-3 text-center text-[11px] text-muted-foreground">Vote to reveal the crowd. One vote per ticker, per day.</p></>
                )}
                {notice && <p className="mt-3 text-center text-xs text-[#ffb4b4]">{notice}</p>}
              </div>
            </article>
          </section>

          <aside id="leaderboard" aria-labelledby="leaderboard-heading" className="rounded-[24px] border border-white/10 bg-card p-5 lg:self-start">
            <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Crowd pulse</p><h2 id="leaderboard-heading" className="mt-1 text-xl font-black tracking-tight">The leaderboard</h2></div><BarChart3 className="size-5 text-primary" /></div>
            <Tabs value={board} onValueChange={(value) => setBoard(value as Board)}><TabsList className="mb-3 h-9 w-full bg-white/5"><TabsTrigger value="hot">Hottest</TabsTrigger><TabsTrigger value="cold">Coldest</TabsTrigger><TabsTrigger value="divisive">Divisive</TabsTrigger></TabsList></Tabs>
            <ol className="space-y-1">
              {leaderboard.map((stock, position) => { const value = scores[stock.symbol]?.score ?? baseScore(stock); return <li key={stock.symbol}><a href={`/ticker/${stock.symbol.toLowerCase()}`} className="grid grid-cols-[24px_40px_1fr_auto] items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-white/4"><span className="font-mono text-xs text-muted-foreground">{String(position + 1).padStart(2, '0')}</span><Mark stock={stock} small /><span className="min-w-0"><strong className="block text-sm">{stock.symbol}</strong><small className="block truncate text-xs text-muted-foreground">{stock.name}</small></span><span className={`font-mono text-sm font-black ${value >= 50 ? 'text-primary' : 'text-destructive'}`}>{value}</span></a></li>; })}
            </ol>
            <a href="/methodology" className="mt-4 flex items-start gap-2 rounded-xl bg-white/4 p-3 text-xs leading-5 text-muted-foreground transition hover:text-foreground"><Info className="mt-0.5 size-4 shrink-0" /> Scores measure community sentiment, not investment quality.</a>
          </aside>
        </div>

        <section className="mt-12 grid gap-4 border-t border-white/8 pt-8 sm:grid-cols-3" aria-label="How StockOrNot works">
          {[['01', 'Vote first', 'No herd effect. Crowd scores stay hidden until you choose.'], ['02', 'See the pulse', 'Explore hot, cold, and genuinely divisive tickers.'], ['03', 'Come back tomorrow', 'Your daily vote keeps sentiment fresh and harder to game.']].map(([num, title, copy]) => <div key={num} className="rounded-2xl bg-white/[.035] p-5"><span className="font-mono text-xs text-primary">{num}</span><h3 className="mt-6 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>)}
        </section>

        <footer className="mt-12 flex flex-col justify-between gap-4 border-t border-white/8 py-8 text-xs text-muted-foreground sm:flex-row"><p>© 2026 StockOrNot · Built for curiosity, not certainty.</p><p className="max-w-xl sm:text-right">Sample delayed data. Sentiment is entertainment and discovery—not investment advice, a recommendation, or an offer to buy or sell securities.</p></footer>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="border border-white/10 bg-card p-5 text-foreground sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-xl font-black">Find a ticker</DialogTitle><DialogDescription>Search the StockOrNot universe of US stocks and ETFs.</DialogDescription></DialogHeader>
          <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try NVDA, Tesla, or an ETF…" className="h-11 border-white/10 bg-white/5 pl-10" />{query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="size-4" /><span className="sr-only">Clear search</span></button>}</div>
          <div className="max-h-80 overflow-y-auto">{matches.length ? matches.map((stock) => <a key={stock.symbol} href={`/ticker/${stock.symbol.toLowerCase()}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5"><Mark stock={stock} small /><span className="min-w-0 flex-1"><strong>{stock.symbol}</strong><small className="ml-2 text-muted-foreground">{stock.type}</small><span className="block truncate text-xs text-muted-foreground">{stock.name}</span></span><ArrowRight className="size-4 text-muted-foreground" /></a>) : <div className="py-12 text-center"><Sparkles className="mx-auto mb-3 size-5 text-primary" /><p className="font-bold">No ticker found</p><p className="mt-1 text-xs text-muted-foreground">We&apos;re starting with a focused demo universe.</p></div>}</div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
