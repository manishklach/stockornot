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

export function score(stock: Stock) {
  return Math.round((stock.hot / (stock.hot + stock.not)) * 100);
}
