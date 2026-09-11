import Link from 'next/link';
import { BarChart3, Gauge, Info } from 'lucide-react';
import {
  getLeaderboard,
  type LeaderboardView,
} from '@/lib/instruments.server';

export const metadata = {
  title: 'Crowd leaderboard · StockOrNot',
  description: 'Explore the hottest, coldest, and most-divisive tickers on StockOrNot.',
  openGraph: { images: [] },
  twitter: { images: [] },
};

function signedCrowd(hot: number, not: number) {
  const total = hot + not;
  if (!total) return 0;
  return ((hot - not) / total) * 100;
}

function tone(value: number) {
  if (value > 15) return 'text-[#5eeaa5]';
  if (value < -15) return 'text-[#ff8fa3]';
  return 'text-[#c4b5fd]';
}

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
    <main className="min-h-screen bg-[#08111d] text-[#f4f6fb] lg:grid lg:grid-cols-[228px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-[#1d2735] bg-[#0a1320] px-5 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-[9px] bg-[#8da8ff] text-sm font-black text-[#0a1320]">S</span>
          <span>
            <strong className="block text-[15px] leading-5 font-bold">StockOrNot</strong>
            <small className="block text-[11px] text-[#8b96a5]">Market information monitor</small>
          </span>
        </Link>
        <nav className="mt-8 space-y-1 text-[14px]" aria-label="Main navigation">
          <Link href="/" className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[#aeb9c7] hover:bg-[#121c29] hover:text-white"><Gauge className="size-4" /> Dashboard</Link>
          <Link href="/leaderboard" className="flex items-center gap-3 rounded-[8px] bg-[#182232] px-3 py-2.5 font-semibold text-white"><BarChart3 className="size-4" /> Leaderboard</Link>
          <Link href="/methodology" className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[#aeb9c7] hover:bg-[#121c29] hover:text-white"><Info className="size-4" /> Methodology</Link>
        </nav>
        <div className="mt-auto border-t border-[#1e2937] pt-4 text-[11px] leading-4 text-[#8b96a5]">
          <p className="font-semibold text-[#e6ebf2]">MVP</p>
          <p className="mt-1">News and Crowd are isolated signals.</p>
        </div>
      </aside>
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-7 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8ea6c8]">Market intelligence</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em]">Ticker leaderboard</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-5 text-[#9aa6b6]">
          Lifetime community sentiment (seed baseline + all organic votes). Per-ticker dashboards show the
          windowed blended crowd — organic window votes + StockTwits, seed excluded.
        </p>
        <div className="mt-4 inline-flex rounded-[10px] border border-[#2a3545] bg-[#0e1724] p-1">
          {(['hot', 'cold', 'divisive'] as LeaderboardView[]).map((option) => (
            <Link
              key={option}
              href={`/leaderboard?view=${option}`}
              className={`rounded-[7px] px-4 py-2 text-[13px] font-bold capitalize ${view === option ? 'bg-[#182232] text-white' : 'text-[#8b96a5] hover:text-white'}`}
            >
              {option === 'hot' ? 'Hottest' : option === 'cold' ? 'Coldest' : 'Divisive'}
            </Link>
          ))}
        </div>
        <ol className="mt-4 overflow-hidden rounded-[12px] border border-[#232f42] bg-[#101a2a]/95">
          {instruments.map((instrument, index) => {
            const signed = signedCrowd(instrument.hot, instrument.not);
            const total = instrument.hot + instrument.not;
            return (
              <li key={instrument.symbol} className="border-b border-[#1e2937] last:border-0">
                <Link href={`/ticker/${instrument.symbol.toLowerCase()}`} className="grid grid-cols-[42px_48px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 hover:bg-[#152033] sm:px-5">
                  <span className="font-mono text-[12px] text-[#5c6878]">{String(index + 1).padStart(2, '0')}</span>
                  <span style={{ backgroundColor: instrument.color }} className="grid size-10 place-items-center rounded-[10px] text-[11px] font-black text-[#0a1320]">{instrument.symbol.slice(0, 2)}</span>
                  <span className="min-w-0">
                    <strong className="mr-2 font-mono text-[13px]">{instrument.symbol}</strong>
                    <span className="truncate text-[12px] text-[#8b96a5]">{instrument.name}</span>
                    <small className="mt-0.5 block text-[10.5px] text-[#5c6878]">{total.toLocaleString()} lifetime votes · {instrument.type}</small>
                  </span>
                  <strong className={`font-mono text-[17px] font-black ${tone(signed)}`}>
                    {`${signed > 0 ? '+' : ''}${signed.toFixed(1)}`}
                  </strong>
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-[11px] leading-4 text-[#5c6878]">
          Lifetime ranking includes the deterministic launch baseline so new tickers sort sensibly. Open a ticker for the windowed organic + StockTwits crowd with confidence. <Link href="/methodology" className="font-semibold text-[#8fb0ff] hover:underline">Methodology →</Link>
        </p>
      </div>
    </main>
  );
}
