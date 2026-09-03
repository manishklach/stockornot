import { StockApp } from '@/components/stock-app';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ticker?: string }>;
}) {
  const { ticker } = await searchParams;
  return <StockApp initialSymbol={ticker} />;
}
