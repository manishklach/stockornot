import { env } from 'cloudflare:workers';
import type { Stock } from '@/lib/stocks';

type InstrumentRow = {
  symbol: string;
  name: string;
  asset_type: 'Stock' | 'ETF';
  primary_exchange: string | null;
  color: string;
  hot: number;
  not_count: number;
};

const selectWithVotes = `
  SELECT
    i.symbol,
    i.name,
    i.asset_type,
    i.primary_exchange,
    i.color,
    i.seed_hot + COALESCE(v.hot, 0) AS hot,
    i.seed_not + COALESCE(v.not_count, 0) AS not_count
  FROM instruments i
  LEFT JOIN (
    SELECT
      symbol,
      SUM(CASE WHEN rating = 'hot' THEN 1 ELSE 0 END) AS hot,
      SUM(CASE WHEN rating = 'not' THEN 1 ELSE 0 END) AS not_count
    FROM votes
    GROUP BY symbol
  ) v ON v.symbol = i.symbol
`;

function fromRow(row: InstrumentRow): Stock {
  return {
    symbol: row.symbol,
    name: row.name,
    type: row.asset_type,
    sector: row.primary_exchange ?? 'US market',
    color: row.color,
    hot: Number(row.hot),
    not: Number(row.not_count),
  };
}

export async function listInstruments() {
  const result = await env.DB.prepare(
    `${selectWithVotes} WHERE i.active = 1 ORDER BY i.symbol`,
  ).all<InstrumentRow>();
  return result.results.map(fromRow);
}

export async function getInstrument(symbol: string) {
  const row = await env.DB.prepare(
    `SELECT
       i.symbol,
       i.name,
       i.asset_type,
       i.primary_exchange,
       i.color,
       i.seed_hot + (SELECT COUNT(*) FROM votes WHERE symbol = i.symbol AND rating = 'hot') AS hot,
       i.seed_not + (SELECT COUNT(*) FROM votes WHERE symbol = i.symbol AND rating = 'not') AS not_count
     FROM instruments i
     WHERE i.active = 1 AND i.symbol = ?
     LIMIT 1`,
  )
    .bind(symbol.toUpperCase())
    .first<InstrumentRow>();
  return row ? fromRow(row) : undefined;
}

export async function getRandomInstrument(excludeSymbol?: string) {
  const row = await env.DB.prepare(
    'SELECT symbol FROM instruments WHERE active = 1 AND symbol != ? ORDER BY RANDOM() LIMIT 1',
  )
    .bind(excludeSymbol?.toUpperCase() ?? '')
    .first<{ symbol: string }>();
  return row ? getInstrument(row.symbol) : undefined;
}

export async function searchInstruments(query: string, limit = 8) {
  const normalized = query.trim().toUpperCase();
  if (!normalized) return [];
  const result = await env.DB.prepare(
    `SELECT
       i.symbol,
       i.name,
       i.asset_type,
       i.primary_exchange,
       i.color,
       i.seed_hot AS hot,
       i.seed_not AS not_count
     FROM instruments i
     WHERE i.active = 1 AND (i.symbol LIKE ? OR UPPER(i.name) LIKE ?)
     ORDER BY CASE WHEN i.symbol = ? THEN 0 WHEN i.symbol LIKE ? THEN 1 ELSE 2 END, i.symbol
     LIMIT ?`,
  )
    .bind(normalized, `%${normalized}%`, normalized, `${normalized}%`, limit)
    .all<InstrumentRow>();
  return result.results.map(fromRow);
}

export type LeaderboardView = 'hot' | 'cold' | 'divisive';

export async function getLeaderboard(view: LeaderboardView, limit = 20) {
  const order =
    view === 'cold'
      ? 'CAST(hot AS REAL) / (hot + not_count) ASC'
      : view === 'divisive'
        ? 'ABS(CAST(hot AS REAL) / (hot + not_count) - 0.5) ASC'
        : 'CAST(hot AS REAL) / (hot + not_count) DESC';
  const result = await env.DB.prepare(
    `SELECT * FROM (${selectWithVotes} WHERE i.active = 1) ranked ORDER BY ${order}, symbol LIMIT ?`,
  )
    .bind(limit)
    .all<InstrumentRow>();
  return result.results.map(fromRow);
}
