import { StockApp } from '@/components/stock-app';
import { listInstruments } from '@/lib/instruments.server';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ticker?: string }>;
}) {
  const { ticker } = await searchParams;
  const instruments = await listInstruments();

  if (instruments.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#071619] px-6 text-center text-[#f5f1e8]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#9fb7bd]">
            StockOrNot
          </p>
          <h1 className="mt-3 text-3xl font-black">Catalog initializing</h1>
          <p className="mt-3 text-[#9fb7bd]">
            The stock and ETF universe will be ready shortly.
          </p>
        </div>
      </main>
    );
  }

  return <StockApp initialSymbol={ticker} stocks={instruments} />;
}
