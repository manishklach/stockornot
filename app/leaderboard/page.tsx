import Link from 'next/link';
import { BarChart3, Gauge, Info } from 'lucide-react';
import {
  getLeaderboard,
  type LeaderboardView,
} from '@/lib/instruments.server';
import { score } from '@/lib/stocks';

export const metadata = {
  title: 'Crowd leaderboard · StockOrNot',
  description: 'Explore the hottest, coldest, and most-divisive tickers on StockOrNot.',
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const query = await searchParams;
  const view: LeaderboardView = ['hot', 'cold', 'divisive'].includes(query.view ?? '')
    ? (query.view as LeaderboardView)
    : 'hot';
  const instruments = await getLeaderboard(view, 25);

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-white/8 bg-[#08111b] px-5 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-black text-primary-foreground">S</span>
          <span><strong className="block text-lg tracking-[-0.04em]">STOCK<span className="text-primary">OR</span>NOT</strong><small className="block text-xs text-muted-foreground">Market sentiment monitor</small></span>
        </Link>
        <nav className="mt-10 space-y-2 text-sm font-semibold">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-white/4 hover:text-foreground"><Gauge className="size-4" /> Dashboard</Link>
          <Link href="/leaderboard" className="flex items-center gap-3 rounded-xl bg-white/7 px-4 py-3"><BarChart3 className="size-4 text-primary" /> Leaderboard</Link>
          <Link href="/methodology" className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-white/4 hover:text-foreground"><Info className="size-4" /> Methodology</Link>
        </nav>
      </aside>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Crowd intelligence</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Ticker leaderboard</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Community sentiment across the StockOrNot universe. Scores include the launch baseline and live votes.</p>
        <div className="mt-7 inline-flex rounded-xl bg-white/5 p-1">
          {(['hot', 'cold', 'divisive'] as LeaderboardView[]).map((option) => (
            <Link key={option} href={`/leaderboard?view=${option}`} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${view === option ? 'bg-white text-[#071014]' : 'text-muted-foreground hover:text-foreground'}`}>{option === 'hot' ? 'Hottest' : option === 'cold' ? 'Coldest' : 'Divisive'}</Link>
          ))}
        </div>
        <ol className="mt-5 overflow-hidden rounded-2xl border border-white/9 bg-card">
          {instruments.map((instrument, index) => {
            const hotness = score(instrument);
            return (
              <li key={instrument.symbol} className="border-b border-white/6 last:border-0">
                <Link href={`/ticker/${instrument.symbol.toLowerCase()}`} className="grid grid-cols-[42px_48px_minmax(0,1fr)_auto] items-center gap-3 p-4 hover:bg-white/[.025] sm:px-6">
                  <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  <span style={{ backgroundColor: instrument.color }} className="grid size-10 place-items-center rounded-xl text-xs font-black text-[#071014]">{instrument.symbol.slice(0, 2)}</span>
                  <span className="min-w-0"><strong className="mr-3">{instrument.symbol}</strong><span className="truncate text-sm text-muted-foreground">{instrument.name}</span></span>
                  <strong className={`font-mono text-lg ${hotness >= 50 ? 'text-primary' : 'text-destructive'}`}>{hotness}%</strong>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
