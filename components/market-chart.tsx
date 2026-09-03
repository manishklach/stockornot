'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Range = '5d' | 'ytd' | '1y';
type MarketData = {
  symbol: string;
  range: Range;
  points: Array<{ timestamp: number; close: number }>;
  latest: {
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
  };
  changePercent: number;
  periodHigh: number;
  periodLow: number;
  asOf: number;
  delayed: true;
  source: 'Massive';
  cached?: boolean;
  stale?: boolean;
};

const ranges: Array<{ value: Range; label: string }> = [
  { value: '5d', label: '5D' },
  { value: 'ytd', label: 'YTD' },
  { value: '1y', label: '1Y' },
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function MarketChart({
  symbol,
  large = false,
}: {
  symbol: string;
  large?: boolean;
}) {
  const [range, setRange] = useState<Range>('5d');
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    fetch(`/api/market/${symbol}?range=${range}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as MarketData & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(payload.error || 'Market data is unavailable.');
        return payload;
      })
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setData(null);
        setError(
          reason instanceof DOMException && reason.name === 'AbortError'
            ? 'The market-data request timed out. Please try again.'
            : reason instanceof Error
              ? reason.message
              : 'Market data is unavailable.',
        );
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [range, retry, symbol]);

  const geometry = useMemo(() => {
    if (!data?.points.length) return null;
    const closes = data.points.map((point) => point.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const spread = Math.max(max - min, max * 0.005);
    return data.points.map((point, index) => ({
      x: (index / Math.max(data.points.length - 1, 1)) * 900,
      y: 215 - ((point.close - min) / spread) * 170,
      ...point,
    }));
  }, [data]);

  const positive = (data?.changePercent ?? 0) >= 0;
  const lineColor = positive ? 'var(--primary)' : 'var(--destructive)';
  const line =
    geometry?.map((point) => `${point.x},${point.y}`).join(' ') ?? '';
  const area = geometry
    ? `M ${geometry[0].x} 235 L ${line.replaceAll(' ', ' L ')} L ${geometry.at(-1)!.x} 235 Z`
    : '';

  return (
    <section aria-label={`${symbol} market price chart`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">
            <Database className="size-3.5" /> Adjusted daily closes · Massive
          </div>
          {data ? (
            <div className="mt-1 flex items-baseline gap-3">
              <strong className="font-mono text-2xl sm:text-3xl">
                {currency.format(data.latest.close)}
              </strong>
              <span
                className={`flex items-center text-sm font-bold ${positive ? 'text-primary' : 'text-destructive'}`}
              >
                {positive ? (
                  <ArrowUpRight className="size-4" />
                ) : (
                  <ArrowDownRight className="size-4" />
                )}
                {positive ? '+' : ''}
                {data.changePercent.toFixed(2)}%
              </span>
            </div>
          ) : (
            <div className="mt-2 h-8 w-40 animate-pulse rounded-lg bg-white/7" />
          )}
        </div>
        <div
          className="flex rounded-lg bg-white/5 p-1"
          aria-label="Chart period"
        >
          {ranges.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                if (option.value === range) return;
                setLoading(true);
                setError('');
                setRange(option.value);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-black transition ${range === option.value ? 'bg-white text-[#071014]' : 'text-muted-foreground hover:text-foreground'}`}
              aria-pressed={range === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`chart-grid relative overflow-hidden rounded-2xl bg-[#0a1519] p-4 ${large ? 'h-80' : 'h-52'}`}
      >
        {loading ? (
          <div className="absolute inset-0 grid place-items-center">
            <RefreshCw className="size-5 animate-spin text-primary" />
            <span className="sr-only">Loading market data</span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <p className="font-bold">Chart temporarily unavailable</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <Button
                onClick={() => {
                  setLoading(true);
                  setError('');
                  setRetry((value) => value + 1);
                }}
                variant="outline"
                className="mt-4 border-white/10 bg-white/5"
              >
                Try again
              </Button>
            </div>
          </div>
        ) : (
          geometry && (
            <svg
              viewBox="0 0 900 240"
              preserveAspectRatio="none"
              className="h-full w-full"
              aria-label={`${symbol} ${range.toUpperCase()} adjusted closing-price movement`}
            >
              <path d={area} fill={lineColor} opacity=".08" />
              <polyline
                points={line}
                fill="none"
                stroke={lineColor}
                strokeWidth="6"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )
        )}
      </div>

      {data && (
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground">
          <span>
            {range.toUpperCase()} range {currency.format(data.periodLow)} —{' '}
            {currency.format(data.periodHigh)}
          </span>
          <span>
            {compactNumber.format(data.latest.volume)} volume · through{' '}
            {new Date(data.asOf).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'UTC',
            })}
            {data.stale ? ' · cached' : ''}
          </span>
        </div>
      )}
    </section>
  );
}
