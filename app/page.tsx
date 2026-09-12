import { redirect } from 'next/navigation';
import { getRandomInstrument } from '@/lib/instruments.server';

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ all?: string }>;
}) {
  const all = (await searchParams)?.all === '1';
  const instrument = await getRandomInstrument(undefined, all ? 'all' : 'featured');
  if (!instrument)
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">StockOrNot</p>
          <h1 className="mt-3 text-3xl font-black">Catalog initializing</h1>
          <p className="mt-3 text-muted-foreground">The stock and ETF universe will be ready shortly.</p>
        </div>
      </main>
    );
  redirect(`/ticker/${instrument.symbol.toLowerCase()}`);
}
