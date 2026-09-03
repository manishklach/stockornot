export type AssetType = 'Stock' | 'ETF';

export type Stock = {
  symbol: string;
  name: string;
  type: AssetType;
  sector: string;
  price: number;
  change: number;
  marketCap: string;
  volume: string;
  range: string;
  color: string;
  history: number[];
  hot: number;
  not: number;
};

export const stocks: Stock[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stock', sector: 'Technology', price: 183.42, change: 2.84, marketCap: '$4.47T', volume: '161.2M', range: '$86.62 — $184.17', color: '#78e4ff', history: [18,26,22,34,31,45,42,54,59,55,69,76], hot: 3079, not: 1139 },
  { symbol: 'PLTR', name: 'Palantir Technologies', type: 'Stock', sector: 'Technology', price: 156.28, change: 4.16, marketCap: '$371B', volume: '54.8M', range: '$30.25 — $190.00', color: '#f0eee6', history: [29,27,33,37,41,39,52,58,63,68,72,81], hot: 3548, not: 351 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF', sector: 'Large Growth', price: 569.44, change: 0.72, marketCap: '$351B AUM', volume: '42.1M', range: '$402.39 — $583.32', color: '#a995ff', history: [32,36,35,42,45,44,52,49,57,61,60,67], hot: 2350, not: 625 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'Stock', sector: 'Consumer Cyclical', price: 329.31, change: -1.84, marketCap: '$1.06T', volume: '97.4M', range: '$212.11 — $488.54', color: '#ff766e', history: [64,59,62,55,49,51,45,48,39,43,36,31], hot: 2802, not: 985 },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'ETF', sector: 'Large Blend', price: 586.12, change: 0.34, marketCap: '$735B AUM', volume: '6.2M', range: '$489.11 — $592.45', color: '#ffcb6b', history: [31,34,37,36,42,45,47,51,50,55,58,61], hot: 1855, not: 380 },
  { symbol: 'RKLB', name: 'Rocket Lab USA', type: 'Stock', sector: 'Industrials', price: 47.62, change: 5.72, marketCap: '$24B', volume: '29.6M', range: '$5.74 — $53.44', color: '#ff9bce', history: [21,26,23,38,35,47,51,48,62,68,74,86], hot: 2158, not: 411 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'Stock', sector: 'Technology', price: 163.57, change: 1.31, marketCap: '$265B', volume: '38.5M', range: '$76.48 — $187.28', color: '#67e8a5', history: [35,32,39,44,41,47,52,56,50,59,63,66], hot: 1634, not: 596 },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'ETF', sector: 'Mid-Cap Growth', price: 72.82, change: -2.14, marketCap: '$6.7B AUM', volume: '8.8M', range: '$38.57 — $82.14', color: '#ff8a66', history: [71,66,62,67,59,54,56,49,45,38,42,34], hot: 802, not: 1141 },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', sector: 'Technology', price: 231.59, change: -0.41, marketCap: '$3.45T', volume: '49.3M', range: '$169.21 — $260.10', color: '#d3dae0', history: [56,59,55,61,63,58,54,57,51,49,52,48], hot: 1789, not: 742 },
  { symbol: 'SCHD', name: 'Schwab U.S. Dividend Equity ETF', type: 'ETF', sector: 'Large Value', price: 27.94, change: 0.18, marketCap: '$69B AUM', volume: '13.1M', range: '$23.87 — $29.72', color: '#76b8ff', history: [40,42,41,45,47,46,49,51,50,54,55,57], hot: 1302, not: 343 },
  { symbol: 'GME', name: 'GameStop Corp.', type: 'Stock', sector: 'Consumer Cyclical', price: 22.48, change: -3.72, marketCap: '$10B', volume: '7.9M', range: '$19.31 — $35.81', color: '#fb7185', history: [62,55,59,48,51,43,46,38,34,39,31,27], hot: 1220, not: 1451 },
  { symbol: 'IBIT', name: 'iShares Bitcoin Trust ETF', type: 'ETF', sector: 'Digital Assets', price: 61.37, change: 2.21, marketCap: '$82B AUM', volume: '31.4M', range: '$28.23 — $72.12', color: '#f59e0b', history: [28,34,31,43,47,44,52,58,55,64,69,73], hot: 1975, not: 702 },
];

export function score(stock: Stock) {
  return Math.round((stock.hot / (stock.hot + stock.not)) * 100);
}

export function getStock(symbol: string) {
  return stocks.find((stock) => stock.symbol === symbol.toUpperCase());
}
