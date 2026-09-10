import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { getInstrument } from '@/lib/instruments.server';

type Range = '5d' | 'ytd' | '1y';
type MassiveBar = {
  c: number;
  h: number;
  l: number;
  o: number;
  t: number;
  v: number;
};
type MarketPayload = {
  symbol: string;
  range: Range;
  points: Array<{ timestamp: number; close: number }>;
  latest: {
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
  };
  changePercent: number;
  periodHigh: number;
  periodLow: number;
  asOf: number;
  delayed: true;
  source: 'Massive';
};

const CACHE_TTL_MS = 15 * 60 * 1000;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fromDate(range: Range, now: Date) {
  if (range === 'ytd') return `${now.getUTCFullYear()}-01-01`;
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - (range === '5d' ? 12 : 370));
  return isoDate(from);
}

function normalize(
  symbol: string,
  range: Range,
  bars: MassiveBar[],
): MarketPayload {
  const usable = range === '5d' ? bars.slice(-5) : bars;
  const first = usable[0];
  const last = usable.at(-1)!;
  return {
    symbol,
    range,
    points: usable.map((bar) => ({ timestamp: bar.t, close: bar.c })),
    latest: {
      close: last.c,
      open: last.o,
      high: last.h,
      low: last.l,
      volume: last.v,
    },
    changePercent: ((last.c - first.c) / first.c) * 100,
    periodHigh: Math.max(...usable.map((bar) => bar.h)),
    periodLow: Math.min(...usable.map((bar) => bar.l)),
    asOf: last.t,
    delayed: true,
    source: 'Massive',
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = rawSymbol.toUpperCase();
  const range = (request.nextUrl.searchParams.get('range') ?? '5d') as Range;
  if (!(await getInstrument(symbol)) || !['5d', 'ytd', '1y'].includes(range)) {
    return NextResponse.json(
      { error: 'Unknown ticker or range.' },
      { status: 400 },
    );
  }

  const cached = await env.DB.prepare(
    'SELECT payload, fetched_at FROM market_cache WHERE symbol = ? AND range = ?',
  )
    .bind(symbol, range)
    .first<{ payload: string; fetched_at: number }>();
  const now = Date.now();
  if (cached && now - cached.fetched_at < CACHE_TTL_MS) {
    return NextResponse.json({ ...JSON.parse(cached.payload), cached: true });
  }

  const apiKey = env.MASSIVE_API_KEY || process.env.MASSIVE_API_KEY;
  if (!apiKey) {
    if (cached)
      return NextResponse.json({
        ...JSON.parse(cached.payload),
        cached: true,
        stale: true,
      });
    return NextResponse.json(
      { error: 'Market data is not configured.' },
      { status: 503 },
    );
  }

  const today = new Date();
  const endpoint = `https://api.massive.com/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/1/day/${fromDate(range, today)}/${isoDate(today)}?adjusted=true&sort=asc&limit=5000`;
  try {
    const upstream = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = (await upstream.json()) as {
      status?: string;
      results?: MassiveBar[];
      error?: string;
      message?: string;
    };
    if (!upstream.ok || !data.results?.length)
      throw new Error(data.error || data.message || 'No market data returned.');
    const payload = normalize(symbol, range, data.results);
    await env.DB.prepare(`INSERT INTO market_cache (symbol, range, payload, fetched_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(symbol, range) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`)
      .bind(symbol, range, JSON.stringify(payload), now)
      .run();
    return NextResponse.json({ ...payload, cached: false });
  } catch (error) {
    if (cached)
      return NextResponse.json({
        ...JSON.parse(cached.payload),
        cached: true,
        stale: true,
      });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Market data is temporarily unavailable.',
      },
      { status: 502 },
    );
  }
}
