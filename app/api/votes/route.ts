import { env } from 'cloudflare:workers';
import { NextRequest, NextResponse } from 'next/server';
import { getStock, stocks } from '@/lib/stocks';

const COOKIE = 'stockornot_voter';
let databaseReady = false;

async function ensureDatabase() {
  if (databaseReady) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_key TEXT NOT NULL,
      symbol TEXT NOT NULL,
      rating TEXT NOT NULL CHECK (rating IN ('hot','not')),
      vote_day TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    env.DB.prepare(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_voter_symbol_day ON votes(voter_key, symbol, vote_day)',
    ),
    env.DB.prepare(
      'CREATE INDEX IF NOT EXISTS idx_votes_symbol_rating ON votes(symbol, rating)',
    ),
    env.DB.prepare(
      'CREATE INDEX IF NOT EXISTS idx_votes_voter_created ON votes(voter_key, created_at)',
    ),
    env.DB.prepare('PRAGMA optimize'),
  ]);
  databaseReady = true;
}

function cookieValue(request: NextRequest) {
  const existing = request.cookies.get(COOKIE)?.value;
  return { voter: existing ?? crypto.randomUUID(), fresh: !existing };
}

async function totals() {
  const result = await env.DB.prepare(
    'SELECT symbol, rating, COUNT(*) AS count FROM votes GROUP BY symbol, rating',
  ).all<{ symbol: string; rating: 'hot' | 'not'; count: number }>();
  const added: Record<string, { hot: number; not: number }> = {};
  for (const row of result.results) {
    added[row.symbol] ??= { hot: 0, not: 0 };
    added[row.symbol][row.rating] = Number(row.count);
  }
  return Object.fromEntries(
    stocks.map((stock) => {
      const hot = stock.hot + (added[stock.symbol]?.hot ?? 0);
      const not = stock.not + (added[stock.symbol]?.not ?? 0);
      return [
        stock.symbol,
        {
          hot,
          not,
          score: Math.round((hot / (hot + not)) * 100),
          total: hot + not,
        },
      ];
    }),
  );
}

export async function GET(request: NextRequest) {
  await ensureDatabase();
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
  await ensureDatabase();
  const { voter, fresh } = cookieValue(request);
  const body = (await request.json().catch(() => null)) as {
    symbol?: string;
    rating?: string;
  } | null;
  const symbol = body?.symbol?.toUpperCase();
  const rating = body?.rating;
  if (!symbol || !getStock(symbol) || (rating !== 'hot' && rating !== 'not')) {
    return NextResponse.json(
      { error: 'Choose a valid ticker and vote.' },
      { status: 400 },
    );
  }

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
    .bind(voter, symbol, rating, day, now)
    .run();

  const response = NextResponse.json({
    scores: await totals(),
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
