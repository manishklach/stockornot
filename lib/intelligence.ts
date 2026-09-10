export type SignalWindow = '24h' | '7d' | '30d';
export type NewsSentiment = 'positive' | 'neutral' | 'negative';

export type TickerProfile = {
  description: string | null;
  industry: string | null;
  marketCap: number | null;
  employees: number | null;
  exchange: string | null;
  currency: string | null;
  homepageUrl: string | null;
  listDate: string | null;
};

export type NewsItem = {
  id: string;
  title: string;
  articleUrl: string;
  publisher: string;
  publishedAt: string;
  summary: string | null;
  sentiment: NewsSentiment;
  reasoning: string | null;
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
  profileStale: boolean;
  newsStale: boolean;
};
