import { env } from 'cloudflare:workers';
import type { SignalWindow } from '@/lib/intelligence';
import {
  confidenceFor,
  crowdScore,
  windowScoreFor,
  type BlendedCrowd,
  type CrowdBreakdown,
  type ExternalSentiment,
} from '@/lib/crowd';

const WINDOW_HOURS: Record<SignalWindow, number> = { '24h': 24, '7d': 168, '30d': 720 };
const EXTERNAL_TTL = 30 * 60 * 1000;

type SeedRow = { seed_hot: number; seed_not: number };
type CountRow = { hot: number; not_count: number };

async function getSeeds(symbol: string): Promise<{ seedHot: number; seedNot: number }> {
  try {
    const row = await env.DB.prepare('SELECT seed_hot, seed_not FROM instruments WHERE symbol = ?')
      .bind(symbol.toUpperCase())
      .first<SeedRow>();
    return { seedHot: Number(row?.seed_hot ?? 0), seedNot: Number(row?.seed_not ?? 0) };
  } catch {
    return { seedHot: 0, seedNot: 0 };
  }
}

async function countOrganic(symbol: string, sinceMs: number | null): Promise<{ hot: number; not: number }> {
  try {
    const row = sinceMs === null
      ? await env.DB.prepare(
          `SELECT SUM(CASE WHEN rating='hot' THEN 1 ELSE 0 END) AS hot,
                  SUM(CASE WHEN rating='not' THEN 1 ELSE 0 END) AS not_count
           FROM votes WHERE symbol = ?`,
        ).bind(symbol.toUpperCase()).first<CountRow>()
      : await env.DB.prepare(
          `SELECT SUM(CASE WHEN rating='hot' THEN 1 ELSE 0 END) AS hot,
                  SUM(CASE WHEN rating='not' THEN 1 ELSE 0 END) AS not_count
           FROM votes WHERE symbol = ? AND created_at >= ?`,
        ).bind(symbol.toUpperCase(), sinceMs).first<CountRow>();
    return { hot: Number(row?.hot ?? 0), not: Number(row?.not_count ?? 0) };
  } catch {
    return { hot: 0, not: 0 };
  }
}

type StockTwitsMessage = {
  entities?: { sentiment?: { basic?: string | null } | null };
  created_at?: string;
};

async function readExternalCache(symbol: string, window: SignalWindow) {
  try {
    const row = await env.DB.prepare(
      'SELECT payload, fetched_at FROM intelligence_cache WHERE symbol = ? AND kind = ?',
    ).bind(symbol.toUpperCase(), `crowd:st:v2:${window}`).first<{ payload: string; fetched_at: number }>();
    if (!row) return null;
    return { value: JSON.parse(row.payload) as Omit<ExternalSentiment, 'stale'>, fetchedAt: row.fetched_at };
  } catch {
    return null;
  }
}

async function writeExternalCache(symbol: string, window: SignalWindow, value: unknown) {
  try {
    await env.DB.prepare(
      `INSERT INTO intelligence_cache (symbol, kind, payload, fetched_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(symbol, kind) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`,
    ).bind(symbol.toUpperCase(), `crowd:st:v2:${window}`, JSON.stringify(value), Date.now()).run();
  } catch {
    /* cache is best-effort */
  }
}

async function fetchStockTwits(symbol: string, window: SignalWindow): Promise<Omit<ExternalSentiment, 'stale'>> {
  const normalized = symbol.toUpperCase();
  const endpoint = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(normalized)}.json?limit=30`;
  const headers: Record<string, string> = { 'User-Agent': 'StockOrNot/0.5 (crowd research)' };
  const token = (env as unknown as Record<string, string | undefined>).STOCKTWITS_TOKEN ?? process.env.STOCKTWITS_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  let response: Response;
  try {
    response = await fetch(endpoint, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error(`StockTwits ${response.status}`);
  const body = (await response.json()) as { messages?: StockTwitsMessage[] };
  const cutoff = Date.now() - WINDOW_HOURS[window] * 3_600_000;
  let bull = 0;
  let bear = 0;
  let messageCount = 0;
  for (const message of body.messages ?? []) {
    if (message.created_at && Date.parse(message.created_at) < cutoff) continue;
    const basic = message.entities?.sentiment?.basic?.toLowerCase() ?? '';
    messageCount += 1;
    if (basic === 'bullish') bull += 1;
    else if (basic === 'bearish') bear += 1;
  }
  const total = bull + bear;
  return {
    source: 'stocktwits',
    bull,
    bear,
    total,
    score: total ? ((bull - bear) / total) * 100 : null,
    messageCount,
  };
}

export async function getExternalSentiment(symbol: string, window: SignalWindow): Promise<ExternalSentiment | null> {
  const cached = await readExternalCache(symbol, window);
  if (cached && Date.now() - cached.fetchedAt < EXTERNAL_TTL) {
    return { ...cached.value, stale: false };
  }
  try {
    const fresh = await fetchStockTwits(symbol, window);
    await writeExternalCache(symbol, window, fresh);
    return { ...fresh, stale: false };
  } catch {
    if (cached) return { ...cached.value, stale: true };
    return null;
  }
}

export async function getBlendedCrowd(symbol: string, window: SignalWindow): Promise<BlendedCrowd> {
  const normalized = symbol.toUpperCase();
  const sinceMs = Date.now() - WINDOW_HOURS[window] * 3_600_000;
  const [{ seedHot, seedNot }, organicAll, organicWindow, external] = await Promise.all([
    getSeeds(normalized),
    countOrganic(normalized, null),
    countOrganic(normalized, sinceMs),
    getExternalSentiment(normalized, window),
  ]);

  const breakdown: CrowdBreakdown = {
    symbol: normalized,
    window,
    seedHot,
    seedNot,
    organicHot: organicAll.hot,
    organicNot: organicAll.not,
    organicWindowHot: organicWindow.hot,
    organicWindowNot: organicWindow.not,
  };

  const lifetimeHot = seedHot + organicAll.hot;
  const lifetimeNot = seedNot + organicAll.not;
  const lifetimeScore = crowdScore(lifetimeHot, lifetimeNot) ?? 0;
  const lifetimeTotal = lifetimeHot + lifetimeNot;

  const { score: windowScore, total: windowTotal } = windowScoreFor(
    organicWindow.hot,
    organicWindow.not,
    external,
  );

  return {
    breakdown,
    external,
    windowScore,
    windowTotal,
    lifetimeScore,
    lifetimeTotal,
    confidence: confidenceFor(windowTotal),
  };
}
