import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const votes = sqliteTable(
  'votes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    voterKey: text('voter_key').notNull(),
    symbol: text('symbol').notNull(),
    rating: text('rating', { enum: ['hot', 'not'] }).notNull(),
    voteDay: text('vote_day').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_votes_voter_symbol_day').on(
      table.voterKey,
      table.symbol,
      table.voteDay,
    ),
    index('idx_votes_symbol_rating').on(table.symbol, table.rating),
    index('idx_votes_voter_created').on(table.voterKey, table.createdAt),
  ],
);

export const marketCache = sqliteTable(
  'market_cache',
  {
    symbol: text('symbol').notNull(),
    range: text('range', { enum: ['5d', 'ytd', '1y'] }).notNull(),
    payload: text('payload').notNull(),
    fetchedAt: integer('fetched_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.symbol, table.range] }),
    index('idx_market_cache_fetched').on(table.fetchedAt),
  ],
);
