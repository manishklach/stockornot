export type SignalWindow = '24h' | '7d' | '30d';
export type NewsSentiment = 'positive' | 'neutral' | 'negative';

export type StockProfile = {
  kind: 'stock';
  assetType: 'Stock';
  description: string | null;
  industry: string | null;
  marketCap: number | null;
  employees: number | null;
  exchange: string | null;
  currency: string | null;
  homepageUrl: string | null;
  listDate: string | null;
};

export type EtfProfile = {
  kind: 'etf';
  assetType: 'ETF';
  // Massive rarely returns company-style fields for ETFs; keep only fund-level context.
  description: string | null;
  industry: null;
  marketCap: null;
  employees: null;
  exchange: string | null;
  currency: string | null;
  homepageUrl: string | null;
  listDate: string | null;
};

export type TickerProfile = StockProfile | EtfProfile;

export type NewsItem = {
  id: string;
  title: string;
  articleUrl: string;
  publisher: string;
  publishedAt: string;
  summary: string | null;
  sentiment: NewsSentiment;
  reasoning: string | null;
  sourceGroup?: 'ticker' | 'macro';
};

export type NewsSignal = {
  score: number | null;
  label: 'Positive' | 'Mixed' | 'Negative' | 'Insufficient data';
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  sourceCount: number;
  coverage: 'Established' | 'Developing' | 'Limited';
  calculatedAt: number;
  articles: NewsItem[];
};

export type TickerIntelligence = {
  profile: TickerProfile | null;
  news: NewsSignal;
  macroExtras: NewsItem[];
  profileStale: boolean;
  newsStale: boolean;
  macroStale: boolean;
};
