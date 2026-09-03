export type AssetType = 'Stock' | 'ETF';

export type Stock = {
  symbol: string;
  name: string;
  type: AssetType;
  sector: string;
  color: string;
  hot: number;
  not: number;
};

export const stocks: Stock[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    type: 'Stock',
    sector: 'Technology',
    color: '#78e4ff',
    hot: 3079,
    not: 1139,
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies',
    type: 'Stock',
    sector: 'Technology',
    color: '#f0eee6',
    hot: 3548,
    not: 351,
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    type: 'ETF',
    sector: 'Large Growth',
    color: '#a995ff',
    hot: 2350,
    not: 625,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
    color: '#ff766e',
    hot: 2802,
    not: 985,
  },
  {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    type: 'ETF',
    sector: 'Large Blend',
    color: '#ffcb6b',
    hot: 1855,
    not: 380,
  },
  {
    symbol: 'RKLB',
    name: 'Rocket Lab USA',
    type: 'Stock',
    sector: 'Industrials',
    color: '#ff9bce',
    hot: 2158,
    not: 411,
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    type: 'Stock',
    sector: 'Technology',
    color: '#67e8a5',
    hot: 1634,
    not: 596,
  },
  {
    symbol: 'ARKK',
    name: 'ARK Innovation ETF',
    type: 'ETF',
    sector: 'Mid-Cap Growth',
    color: '#ff8a66',
    hot: 802,
    not: 1141,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'Stock',
    sector: 'Technology',
    color: '#d3dae0',
    hot: 1789,
    not: 742,
  },
  {
    symbol: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    type: 'ETF',
    sector: 'Large Value',
    color: '#76b8ff',
    hot: 1302,
    not: 343,
  },
  {
    symbol: 'GME',
    name: 'GameStop Corp.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
    color: '#fb7185',
    hot: 1220,
    not: 1451,
  },
  {
    symbol: 'IBIT',
    name: 'iShares Bitcoin Trust ETF',
    type: 'ETF',
    sector: 'Digital Assets',
    color: '#f59e0b',
    hot: 1975,
    not: 702,
  },
];

export function score(stock: Stock) {
  return Math.round((stock.hot / (stock.hot + stock.not)) * 100);
}

export function getStock(symbol: string) {
  return stocks.find((stock) => stock.symbol === symbol.toUpperCase());
}
