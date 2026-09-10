import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { getInstrument, listInstruments } from '@/lib/instruments.server';
import { score } from '@/lib/stocks';

const COOKIE = 'stockornot_voter';

function cookieValue(request: NextRequest) {
  const existing = request.cookies.get(COOKIE)?.value;
  return { voter: existing ?? crypto.randomUUID(), fresh: !existing };
}

async function totals() {
  const instruments = await listInstruments();
  return Object.fromEntries(
    instruments.map((stock) => [
      stock.symbol,
      {
        hot: stock.hot,
        not: stock.not,
        score: score(stock),
        total: stock.hot + stock.not,
      },
    ]),
  );
}

export async function GET(request: NextRequest) {
  const { voter, fresh } = cookieValue(request);
  const response = NextResponse.json({ scores: await totals() });
  if (fresh)
    response.cookies.set(COOKIE, voter, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  return response;
}

export async function POST(request: NextRequest) {
  const { voter, fresh } = cookieValue(request);
  const body = (await request.json().catch(() => null)) as {
    symbol?: string;
    rating?: string;
  } | null;
  const symbol = body?.symbol?.toUpperCase();
  const rating = body?.rating;
  const instrument = symbol ? await getInstrument(symbol) : undefined;
  if (!instrument || (rating !== 'hot' && rating !== 'not')) {
    return NextResponse.json(
      { error: 'Choose a valid ticker and vote.' },
      { status: 400 },
    );
  }
  const validatedSymbol = instrument.symbol;

  const now = Date.now();
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS count FROM votes WHERE voter_key = ? AND created_at > ?',
  )
    .bind(voter, now - 60_000)
    .first<{ count: number }>();
  if (Number(recent?.count ?? 0) >= 30)
    return NextResponse.json(
      { error: 'Voting a little too fast. Try again in a minute.' },
      { status: 429 },
    );

  const day = new Date(now).toISOString().slice(0, 10);
  await env.DB.prepare(`INSERT INTO votes (voter_key, symbol, rating, vote_day, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(voter_key, symbol, vote_day) DO UPDATE SET rating = excluded.rating, created_at = excluded.created_at`)
    .bind(voter, validatedSymbol, rating, day, now)
    .run();

  const updated = await getInstrument(validatedSymbol);
  if (!updated)
    return NextResponse.json(
      { error: 'Ticker became unavailable.' },
      { status: 409 },
    );
  const response = NextResponse.json({
    score: {
      hot: updated.hot,
      not: updated.not,
      score: score(updated),
      total: updated.hot + updated.not,
    },
    accepted: true,
  });
  if (fresh)
    response.cookies.set(COOKIE, voter, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
  return response;
}
