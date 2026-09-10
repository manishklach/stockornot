import { redirect } from 'next/navigation';
import { searchInstruments } from '@/lib/instruments.server';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const normalized = q.trim().toUpperCase().slice(0, 80);
  if (!normalized) redirect('/');

  const results = await searchInstruments(normalized, 8);
  const match =
    results.find((instrument) => instrument.symbol === normalized) ?? results[0];

  if (match) redirect(`/ticker/${match.symbol.toLowerCase()}`);
  redirect(`/ticker/${encodeURIComponent(normalized.toLowerCase())}`);
}
