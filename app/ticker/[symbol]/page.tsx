import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CircleAlert, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStock, score, stocks } from '@/lib/stocks';
import { MarketChart } from '@/components/market-chart';

type Props = { params: Promise<{ symbol: string }> };

export function generateStaticParams() {
  return stocks.map((stock) => ({ symbol: stock.symbol.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const stock = getStock(symbol);
  if (!stock)
    return {
      title: 'Ticker not found · StockOrNot',
      openGraph: { images: [] },
      twitter: { images: [] },
    };
  const description = `${stock.symbol} is ${score(stock)}% hot on StockOrNot. See crowd sentiment and adjusted market history.`;
  return {
    title: `${stock.symbol} sentiment · StockOrNot`,
    description,
    openGraph: {
      title: `${stock.symbol}: ${score(stock)}% hot`,
      description,
      images: [],
    },
    twitter: {
      card: 'summary',
      title: `${stock.symbol}: ${score(stock)}% hot`,
      description,
      images: [],
    },
  };
}

export default async function TickerPage({ params }: Props) {
  const { symbol } = await params;
  const stock = getStock(symbol);
  if (!stock)
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="text-center">
          <CircleAlert className="mx-auto mb-4 size-8 text-destructive" />
          <h1 className="text-2xl font-black">Ticker not found</h1>
          <Link className="mt-5 inline-block text-primary" href="/">
            Back to rating
          </Link>
        </div>
      </main>
    );
  const sentiment = score(stock);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/8">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
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
            <ArrowLeft className="size-4" /> Back to voting
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span
              style={{ backgroundColor: stock.color }}
              className="grid size-16 place-items-center rounded-2xl text-xl font-black text-[#071014]"
            >
              {stock.symbol.slice(0, 2)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-black tracking-[-.05em]">
                  {stock.symbol}
                </h1>
                <span className="rounded-md bg-white/7 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {stock.type}
                </span>
              </div>
              <p className="text-muted-foreground">{stock.name}</p>
            </div>
          </div>
          <span className="rounded-full border border-primary/25 bg-primary/7 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-primary">
            Adjusted market data
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-[1fr_310px]">
          <section className="rounded-[26px] border border-white/10 bg-card p-6 sm:p-8">
            <MarketChart symbol={stock.symbol} large />
            <dl className="mt-7 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <dt>Sector</dt>
                <dd>{stock.sector}</dd>
              </div>
              <div>
                <dt>Asset type</dt>
                <dd>{stock.type}</dd>
              </div>
              <div>
                <dt>Venue</dt>
                <dd>US market</dd>
              </div>
              <div>
                <dt>Price source</dt>
                <dd>Massive</dd>
              </div>
            </dl>
          </section>
          <aside className="rounded-[26px] border border-white/10 bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">
              Crowd verdict
            </p>
            <div className="my-7 text-center">
              <div
                className="relative mx-auto grid size-40 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) ${sentiment * 3.6}deg, var(--destructive) 0)`,
                }}
              >
                <div className="grid size-[132px] place-items-center rounded-full bg-card">
                  <span>
                    <strong className="block font-mono text-4xl">
                      {sentiment}%
                    </strong>
                    <small className="text-sm font-bold text-primary">
                      HOT
                    </small>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stock.hot.toLocaleString()} hot</span>
              <span>{stock.not.toLocaleString()} not</span>
            </div>
            <Link href={`/?ticker=${stock.symbol.toLowerCase()}`}>
              <Button className="mt-6 h-12 w-full text-base font-black">
                <Flame /> Rate {stock.symbol}
              </Button>
            </Link>
            <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">
              Community sentiment only. Not investment advice.
            </p>
          </aside>
        </div>
        <section className="mt-5 flex gap-3 rounded-2xl border border-white/8 bg-white/[.03] p-5 text-sm leading-6 text-muted-foreground">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            StockOrNot scores show how this community voted today. They do not
            evaluate valuation, risk, suitability, or future returns. Price
            history shown here uses adjusted daily aggregate bars from Massive
            and may be delayed. Always verify prices with your broker.
          </p>
        </section>
      </div>
    </main>
  );
}
