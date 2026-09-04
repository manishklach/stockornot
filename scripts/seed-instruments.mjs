import fs from 'node:fs/promises';
import path from 'node:path';

const migrationPath = process.argv[2];
if (!migrationPath) {
  throw new Error('Pass the generated instrument migration path.');
}

const envText = await fs.readFile(path.resolve('.env.local'), 'utf8');
const apiKey = envText.match(/^MASSIVE_API_KEY=(.+)$/m)?.[1]?.trim();
if (!apiKey) throw new Error('MASSIVE_API_KEY is missing from .env.local.');

const palette = [
  '#78e4ff',
  '#f0eee6',
  '#a995ff',
  '#ff766e',
  '#ffcb6b',
  '#ff9bce',
  '#67e8a5',
  '#76b8ff',
  '#f59e0b',
  '#d3dae0',
];

const launchTotals = {
  NVDA: [3079, 1139],
  PLTR: [3548, 351],
  QQQ: [2350, 625],
  TSLA: [2802, 985],
  VOO: [1855, 380],
  RKLB: [2158, 411],
  AMD: [1634, 596],
  ARKK: [802, 1141],
  AAPL: [1789, 742],
  SCHD: [1302, 343],
  GME: [1220, 1451],
  IBIT: [1975, 702],
};

function hashSymbol(symbol) {
  let hash = 2166136261;
  for (const character of symbol) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function quote(value) {
  if (value == null) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function request(url) {
  for (;;) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.status !== 429) {
      if (!response.ok) {
        throw new Error(`Massive request failed with ${response.status}.`);
      }
      return response.json();
    }
    const retryAfter = Number(response.headers.get('retry-after')) || 65;
    process.stdout.write(
      `Rate limit reached; resuming in ${retryAfter} seconds.\n`,
    );
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
  }
}

async function fetchType(providerType) {
  let url = `https://api.massive.com/v3/reference/tickers?market=stocks&locale=us&active=true&type=${providerType}&order=asc&limit=1000&sort=ticker`;
  const results = [];
  let page = 0;
  while (url) {
    const data = await request(url);
    results.push(...(data.results ?? []));
    page += 1;
    process.stdout.write(
      `${providerType}: page ${page}, ${results.length} instruments\n`,
    );
    url = data.next_url ?? '';
  }
  return results;
}

const [commonStocks, etfs] = await Promise.all([
  fetchType('CS'),
  fetchType('ETF'),
]);
const syncedAt = Date.now();
const seen = new Set();
const instruments = [...commonStocks, ...etfs]
  .filter(
    (item) =>
      item.active &&
      item.ticker &&
      item.name &&
      /^[A-Z0-9.-]{1,15}$/.test(item.ticker) &&
      !seen.has(item.ticker) &&
      seen.add(item.ticker),
  )
  .sort((left, right) => left.ticker.localeCompare(right.ticker));

const chunks = [];
for (let start = 0; start < instruments.length; start += 200) {
  const values = instruments.slice(start, start + 200).map((item) => {
    const hash = hashSymbol(item.ticker);
    const total = 100 + (hash % 3901);
    const sentiment = 25 + ((hash >>> 8) % 66);
    const seededHot = Math.round((total * sentiment) / 100);
    const [hot, not] = launchTotals[item.ticker] ?? [
      seededHot,
      total - seededHot,
    ];
    return `(${quote(item.ticker)}, ${quote(item.name)}, ${quote(item.type === 'ETF' ? 'ETF' : 'Stock')}, ${quote(item.type)}, ${quote(item.primary_exchange)}, ${quote(item.currency_name)}, 1, ${quote(palette[hash % palette.length])}, ${hot}, ${not}, ${quote(item.last_updated_utc)}, ${syncedAt})`;
  });
  chunks.push(
    `INSERT OR REPLACE INTO instruments (symbol, name, asset_type, provider_type, primary_exchange, currency, active, color, seed_hot, seed_not, source_updated_at, synced_at) VALUES\n${values.join(',\n')};`,
  );
}

await fs.appendFile(
  path.resolve(migrationPath),
  `\n--> statement-breakpoint\n${chunks.join('\n--> statement-breakpoint\n')}\n--> statement-breakpoint\nPRAGMA optimize;\n`,
);

process.stdout.write(
  `Seeded ${instruments.length} active instruments (${commonStocks.length} CS source rows, ${etfs.length} ETF source rows).\n`,
);
