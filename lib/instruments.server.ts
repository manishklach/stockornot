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
    `${selectWithVotes} WHERE i.active = 1 AND i.symbol = ? LIMIT 1`,
  )
    .bind(symbol.toUpperCase())
    .first<InstrumentRow>();
  return row ? fromRow(row) : undefined;
}
