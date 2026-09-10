import { env } from 'cloudflare:workers';
import type {
  NewsItem,
  NewsSentiment,
  NewsSignal,
  SignalWindow,
  TickerIntelligence,
  TickerProfile,
} from '@/lib/intelligence';

type CacheRow = { payload: string; fetched_at: number };
type MassiveProfile = {
  description?: string;
  sic_description?: string;
  market_cap?: number;
  total_employees?: number;
  primary_exchange?: string;
  currency_name?: string;
  homepage_url?: string;
  list_date?: string;
};
type MassiveInsight = {
  ticker?: string;
  sentiment?: NewsSentiment;
  sentiment_reasoning?: string;
};
type MassiveArticle = {
  id?: string;
  title?: string;
  article_url?: string;
  published_utc?: string;
  description?: string;
  publisher?: { name?: string };
  insights?: MassiveInsight[];
};

const PROFILE_TTL = 7 * 24 * 60 * 60 * 1000;
const NEWS_TTL = 30 * 60 * 1000;
const WINDOW_HOURS: Record<SignalWindow, number> = {
  '24h': 24,
  '7d': 7 * 24,
  '30d': 30 * 24,
};

async function readCache<T>(symbol: string, kind: string) {
  const row = await env.DB.prepare(
    'SELECT payload, fetched_at FROM intelligence_cache WHERE symbol = ? AND kind = ?',
  )
    .bind(symbol, kind)
    .first<CacheRow>();
  if (!row) return null;
  return { value: JSON.parse(row.payload) as T, fetchedAt: row.fetched_at };
}

async function writeCache(symbol: string, kind: string, value: unknown) {
  await env.DB.prepare(
    `INSERT INTO intelligence_cache (symbol, kind, payload, fetched_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(symbol, kind) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`,
  )
    .bind(symbol, kind, JSON.stringify(value), Date.now())
    .run();
}

function apiKey() {
  return env.MASSIVE_API_KEY || process.env.MASSIVE_API_KEY;
}

async function massiveJson<T>(url: string) {
  const key = apiKey();
  if (!key) throw new Error('Market intelligence is not configured.');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = (await response.json()) as T & {
    error?: string;
    message?: string;
  };
  if (!response.ok)
    throw new Error(body.error || body.message || `Massive returned ${response.status}.`);
  return body;
}

function safeExternalUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

async function getProfile(symbol: string) {
  const cached = await readCache<TickerProfile>(symbol, 'profile');
  if (cached && Date.now() - cached.fetchedAt < PROFILE_TTL)
    return { value: cached.value, stale: false };
  try {
    const body = await massiveJson<{ results?: MassiveProfile }>(
      `https://api.massive.com/v3/reference/tickers/${encodeURIComponent(symbol)}`,
    );
    if (!body.results) throw new Error('No profile returned.');
    const profile: TickerProfile = {
      description: body.results.description ?? null,
      industry: body.results.sic_description ?? null,
      marketCap: body.results.market_cap ?? null,
      employees: body.results.total_employees ?? null,
      exchange: body.results.primary_exchange ?? null,
      currency: body.results.currency_name?.toUpperCase() ?? null,
      homepageUrl: safeExternalUrl(body.results.homepage_url),
      listDate: body.results.list_date ?? null,
    };
    await writeCache(symbol, 'profile', profile);
    return { value: profile, stale: false };
  } catch {
    return { value: cached?.value ?? null, stale: Boolean(cached) };
  }
}

function emptySignal(): NewsSignal {
  return {
    score: null,
    label: 'Insufficient data',
    total: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
    sourceCount: 0,
    coverage: 'Limited',
    calculatedAt: Date.now(),
    articles: [],
  };
}

function calculateNewsSignal(
  symbol: string,
  window: SignalWindow,
  rawArticles: MassiveArticle[],
): NewsSignal {
  const now = Date.now();
  const cutoff = now - WINDOW_HOURS[window] * 60 * 60 * 1000;
  const seen = new Set<string>();
  const publisherCounts = new Map<string, number>();
  const articles: NewsItem[] = [];

  for (const article of rawArticles) {
    const publishedAt = Date.parse(article.published_utc ?? '');
    const insight = article.insights?.find(
      (item) => item.ticker?.toUpperCase() === symbol,
    );
    const articleUrl = safeExternalUrl(article.article_url);
    if (
      !article.title ||
      !articleUrl ||
      !Number.isFinite(publishedAt) ||
      publishedAt < cutoff ||
      !insight?.sentiment
    )
      continue;
    const titleKey = article.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (seen.has(titleKey)) continue;
    const publisher = article.publisher?.name?.trim() || 'Unknown publisher';
    const publisherCount = publisherCounts.get(publisher) ?? 0;
    if (publisherCount >= 4) continue;
    seen.add(titleKey);
    publisherCounts.set(publisher, publisherCount + 1);
    articles.push({
      id: article.id ?? `${publishedAt}-${titleKey}`,
      title: article.title,
      articleUrl,
      publisher,
      publishedAt: new Date(publishedAt).toISOString(),
      summary: article.description ?? null,
      sentiment: insight.sentiment,
      reasoning: insight.sentiment_reasoning ?? null,
    });
  }

  articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  if (!articles.length) return emptySignal();

  const positive = articles.filter((item) => item.sentiment === 'positive').length;
  const neutral = articles.filter((item) => item.sentiment === 'neutral').length;
  const negative = articles.filter((item) => item.sentiment === 'negative').length;
  if (articles.length < 2)
    return {
      score: null,
      label: 'Insufficient data',
      total: articles.length,
      positive,
      neutral,
      negative,
      sourceCount: publisherCounts.size,
      coverage: 'Limited',
      calculatedAt: now,
      articles,
    };

  const halfLifeHours = Math.max(12, WINDOW_HOURS[window] / 3);
  let weightedTotal = 0;
  let totalWeight = 0;
  for (const article of articles) {
    const ageHours = Math.max(0, (now - Date.parse(article.publishedAt)) / 3_600_000);
    const weight = 2 ** (-ageHours / halfLifeHours);
    const value = article.sentiment === 'positive' ? 1 : article.sentiment === 'negative' ? -1 : 0;
    weightedTotal += value * weight;
    totalWeight += weight;
  }
  const score = Math.round((weightedTotal / totalWeight) * 100);
  return {
    score,
    label: score > 15 ? 'Positive' : score < -15 ? 'Negative' : 'Mixed',
    total: articles.length,
    positive,
    neutral,
    negative,
    sourceCount: publisherCounts.size,
    coverage: articles.length >= 8 ? 'Established' : articles.length >= 3 ? 'Developing' : 'Limited',
    calculatedAt: now,
    articles: articles.slice(0, 12),
  };
}

async function getNews(symbol: string, window: SignalWindow) {
  const kind = `news:${window}`;
  const cached = await readCache<NewsSignal>(symbol, kind);
  if (cached && Date.now() - cached.fetchedAt < NEWS_TTL)
    return { value: cached.value, stale: false };
  try {
    const start = new Date(Date.now() - WINDOW_HOURS[window] * 3_600_000).toISOString();
    const endpoint = new URL('https://api.massive.com/v2/reference/news');
    endpoint.searchParams.set('ticker', symbol);
    endpoint.searchParams.set('published_utc.gte', start);
    endpoint.searchParams.set('order', 'desc');
    endpoint.searchParams.set('sort', 'published_utc');
    endpoint.searchParams.set('limit', '50');
    const body = await massiveJson<{ results?: MassiveArticle[] }>(endpoint.toString());
    const signal = calculateNewsSignal(symbol, window, body.results ?? []);
    await writeCache(symbol, kind, signal);
    return { value: signal, stale: false };
  } catch {
    return { value: cached?.value ?? emptySignal(), stale: Boolean(cached) };
  }
}

export async function getTickerIntelligence(
  symbol: string,
  window: SignalWindow,
): Promise<TickerIntelligence> {
  const normalized = symbol.toUpperCase();
  const [profile, news] = await Promise.all([
    getProfile(normalized),
    getNews(normalized, window),
  ]);
  return {
    profile: profile.value,
    news: news.value,
    profileStale: profile.stale,
    newsStale: news.stale,
  };
}
