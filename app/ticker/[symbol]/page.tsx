import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { TickerDashboard } from '@/components/ticker-dashboard';
import type { SignalWindow } from '@/lib/intelligence';
import { getTickerIntelligence } from '@/lib/intelligence.server';
import { getBlendedCrowd } from '@/lib/crowd.server';
import { getInstrument, getRandomInstrument } from '@/lib/instruments.server';

type Props = {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ window?: string; all?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const stock = await getInstrument(symbol);
  if (!stock)
    return {
      title: 'Ticker not found · StockOrNot',
      openGraph: { images: [] },
      twitter: { images: [] },
    };
  const description = `Explore news sentiment, crowd opinion, and company context for ${stock.name} (${stock.symbol}) on StockOrNot.`;
  return {
    title: `${stock.symbol} intelligence · StockOrNot`,
    description,
    openGraph: {
      title: `${stock.symbol} intelligence · StockOrNot`,
      description,
      images: [],
    },
    twitter: {
      card: 'summary',
      title: `${stock.symbol} intelligence · StockOrNot`,
      description,
      images: [],
    },
  };
}

export default async function TickerPage({ params, searchParams }: Props) {
  const [{ symbol }, query] = await Promise.all([params, searchParams]);
  const stock = await getInstrument(symbol);
  if (!stock)
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
        <div className="text-center">
          <CircleAlert className="mx-auto mb-4 size-8 text-destructive" />
          <h1 className="text-2xl font-black">Ticker not found</h1>
          <Link className="mt-5 inline-block font-bold text-primary" href="/">
            Open a random ticker
          </Link>
        </div>
      </main>
    );

  const signalWindow: SignalWindow = ['24h', '7d', '30d'].includes(
    query.window ?? '',
  )
    ? (query.window as SignalWindow)
    : '7d';
  const randomMode = query.all === '1' ? 'all' : 'featured';
  const [intelligence, next, crowd] = await Promise.all([
    getTickerIntelligence(stock.symbol, signalWindow, stock.type),
    getRandomInstrument(stock.symbol, randomMode),
    getBlendedCrowd(stock.symbol, signalWindow),
  ]);

  return (
    <TickerDashboard
      stock={stock}
      nextSymbol={next?.symbol ?? stock.symbol}
      intelligence={intelligence}
      signalWindow={signalWindow}
      crowd={crowd}
      randomMode={randomMode}
    />
  );
}
