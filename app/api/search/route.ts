import { NextRequest, NextResponse } from 'next/server';
import { searchInstruments } from '@/lib/instruments.server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 80) ?? '';
  if (query.length < 1)
    return NextResponse.json({ results: [] });
  const results = await searchInstruments(query, 8);
  return NextResponse.json({
    results: results.map(({ symbol, name, type }) => ({ symbol, name, type })),
  });
}
