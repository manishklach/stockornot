import type { SignalWindow } from '@/lib/intelligence';

export type CrowdBreakdown = {
  symbol: string;
  window: SignalWindow;
  seedHot: number;
  seedNot: number;
  organicHot: number;
  organicNot: number;
  organicWindowHot: number;
  organicWindowNot: number;
};

export type ExternalSentiment = {
  source: 'stocktwits';
  bull: number;
  bear: number;
  total: number;
  score: number | null;
  stale: boolean;
  messageCount: number;
};

export type BlendedCrowd = {
  breakdown: CrowdBreakdown;
  external: ExternalSentiment | null;
  /** Windowed blended score: (organicWindow + external) or null when N too small. */
  windowScore: number | null;
  windowTotal: number;
  /** Lifetime score including seeds (backward-compatible). */
  lifetimeScore: number;
  lifetimeTotal: number;
  confidence: 'Limited' | 'Developing' | 'Established';
};

export function crowdScore(hot: number, not: number): number | null {
  const total = hot + not;
  if (total <= 0) return null;
  return ((hot - not) / total) * 100;
}

export function confidenceFor(n: number): BlendedCrowd['confidence'] {
  if (n >= 50) return 'Established';
  if (n >= 10) return 'Developing';
  return 'Limited';
}

/** Wilson lower-bound style guard: require minimum N before trusting a windowed score. */
export function windowScoreFor(
  organicHot: number,
  organicNot: number,
  external: ExternalSentiment | null,
  minN = 5,
): { score: number | null; total: number } {
  const bull = external?.bull ?? 0;
  const bear = external?.bear ?? 0;
  const hot = organicHot + bull;
  const not = organicNot + bear;
  const total = hot + not;
  if (total < minN) return { score: null, total };
  return { score: crowdScore(hot, not), total };
}
