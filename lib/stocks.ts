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

type Instrument = Pick<Stock, 'symbol' | 'name' | 'type' | 'sector'>;

const catalog: Instrument[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'RKLB',
    name: 'Rocket Lab USA',
    type: 'Stock',
    sector: 'Industrials',
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    type: 'Stock',
    sector: 'Technology',
  },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', sector: 'Technology' },
  {
    symbol: 'GME',
    name: 'GameStop Corp.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'Stock',
    sector: 'Communication Services',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    type: 'Stock',
    sector: 'Communication Services',
  },
  {
    symbol: 'AVGO',
    name: 'Broadcom Inc.',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'NFLX',
    name: 'Netflix, Inc.',
    type: 'Stock',
    sector: 'Communication Services',
  },
  {
    symbol: 'COST',
    name: 'Costco Wholesale Corporation',
    type: 'Stock',
    sector: 'Consumer Defensive',
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    type: 'Stock',
    sector: 'Financial Services',
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    type: 'Stock',
    sector: 'Financial Services',
  },
  {
    symbol: 'MA',
    name: 'Mastercard Incorporated',
    type: 'Stock',
    sector: 'Financial Services',
  },
  {
    symbol: 'WMT',
    name: 'Walmart Inc.',
    type: 'Stock',
    sector: 'Consumer Defensive',
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    type: 'Stock',
    sector: 'Healthcare',
  },
  {
    symbol: 'UNH',
    name: 'UnitedHealth Group Incorporated',
    type: 'Stock',
    sector: 'Healthcare',
  },
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    type: 'Stock',
    sector: 'Energy',
  },
  {
    symbol: 'CVX',
    name: 'Chevron Corporation',
    type: 'Stock',
    sector: 'Energy',
  },
  {
    symbol: 'KO',
    name: 'The Coca-Cola Company',
    type: 'Stock',
    sector: 'Consumer Defensive',
  },
  {
    symbol: 'PEP',
    name: 'PepsiCo, Inc.',
    type: 'Stock',
    sector: 'Consumer Defensive',
  },
  {
    symbol: 'MCD',
    name: "McDonald's Corporation",
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'DIS',
    name: 'The Walt Disney Company',
    type: 'Stock',
    sector: 'Communication Services',
  },
  {
    symbol: 'NKE',
    name: 'NIKE, Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'SBUX',
    name: 'Starbucks Corporation',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'BA',
    name: 'The Boeing Company',
    type: 'Stock',
    sector: 'Industrials',
  },
  {
    symbol: 'CAT',
    name: 'Caterpillar Inc.',
    type: 'Stock',
    sector: 'Industrials',
  },
  { symbol: 'GE', name: 'GE Aerospace', type: 'Stock', sector: 'Industrials' },
  {
    symbol: 'IBM',
    name: 'International Business Machines Corporation',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'ORCL',
    name: 'Oracle Corporation',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'CRM',
    name: 'Salesforce, Inc.',
    type: 'Stock',
    sector: 'Technology',
  },
  { symbol: 'ADBE', name: 'Adobe Inc.', type: 'Stock', sector: 'Technology' },
  {
    symbol: 'INTC',
    name: 'Intel Corporation',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'QCOM',
    name: 'QUALCOMM Incorporated',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'MU',
    name: 'Micron Technology, Inc.',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'ARM',
    name: 'Arm Holdings plc',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'SMCI',
    name: 'Super Micro Computer, Inc.',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'ANET',
    name: 'Arista Networks, Inc.',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'PANW',
    name: 'Palo Alto Networks, Inc.',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'CRWD',
    name: 'CrowdStrike Holdings, Inc.',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'NOW',
    name: 'ServiceNow, Inc.',
    type: 'Stock',
    sector: 'Technology',
  },
  { symbol: 'SHOP', name: 'Shopify Inc.', type: 'Stock', sector: 'Technology' },
  {
    symbol: 'UBER',
    name: 'Uber Technologies, Inc.',
    type: 'Stock',
    sector: 'Technology',
  },
  {
    symbol: 'ABNB',
    name: 'Airbnb, Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Global, Inc.',
    type: 'Stock',
    sector: 'Financial Services',
  },
  {
    symbol: 'HOOD',
    name: 'Robinhood Markets, Inc.',
    type: 'Stock',
    sector: 'Financial Services',
  },
  {
    symbol: 'SOFI',
    name: 'SoFi Technologies, Inc.',
    type: 'Stock',
    sector: 'Financial Services',
  },
  {
    symbol: 'RBLX',
    name: 'Roblox Corporation',
    type: 'Stock',
    sector: 'Communication Services',
  },
  {
    symbol: 'SNAP',
    name: 'Snap Inc.',
    type: 'Stock',
    sector: 'Communication Services',
  },
  {
    symbol: 'PINS',
    name: 'Pinterest, Inc.',
    type: 'Stock',
    sector: 'Communication Services',
  },
  {
    symbol: 'SPOT',
    name: 'Spotify Technology S.A.',
    type: 'Stock',
    sector: 'Communication Services',
  },
  {
    symbol: 'TTD',
    name: 'The Trade Desk, Inc.',
    type: 'Stock',
    sector: 'Communication Services',
  },
  {
    symbol: 'PYPL',
    name: 'PayPal Holdings, Inc.',
    type: 'Stock',
    sector: 'Financial Services',
  },
  {
    symbol: 'XYZ',
    name: 'Block, Inc.',
    type: 'Stock',
    sector: 'Financial Services',
  },
  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    type: 'Stock',
    sector: 'Healthcare',
  },
  {
    symbol: 'PG',
    name: 'The Procter & Gamble Company',
    type: 'Stock',
    sector: 'Consumer Defensive',
  },
  {
    symbol: 'HD',
    name: 'The Home Depot, Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'LOW',
    name: "Lowe's Companies, Inc.",
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'TGT',
    name: 'Target Corporation',
    type: 'Stock',
    sector: 'Consumer Defensive',
  },
  {
    symbol: 'F',
    name: 'Ford Motor Company',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'GM',
    name: 'General Motors Company',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'RIVN',
    name: 'Rivian Automotive, Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'LCID',
    name: 'Lucid Group, Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'MRK',
    name: 'Merck & Co., Inc.',
    type: 'Stock',
    sector: 'Healthcare',
  },
  { symbol: 'ABBV', name: 'AbbVie Inc.', type: 'Stock', sector: 'Healthcare' },
  { symbol: 'AMGN', name: 'Amgen Inc.', type: 'Stock', sector: 'Healthcare' },
  {
    symbol: 'GILD',
    name: 'Gilead Sciences, Inc.',
    type: 'Stock',
    sector: 'Healthcare',
  },
  {
    symbol: 'TMO',
    name: 'Thermo Fisher Scientific Inc.',
    type: 'Stock',
    sector: 'Healthcare',
  },
  {
    symbol: 'ISRG',
    name: 'Intuitive Surgical, Inc.',
    type: 'Stock',
    sector: 'Healthcare',
  },
  {
    symbol: 'BKNG',
    name: 'Booking Holdings Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'MAR',
    name: 'Marriott International, Inc.',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'DAL',
    name: 'Delta Air Lines, Inc.',
    type: 'Stock',
    sector: 'Industrials',
  },
  {
    symbol: 'CCL',
    name: 'Carnival Corporation',
    type: 'Stock',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'LMT',
    name: 'Lockheed Martin Corporation',
    type: 'Stock',
    sector: 'Industrials',
  },
  {
    symbol: 'NOC',
    name: 'Northrop Grumman Corporation',
    type: 'Stock',
    sector: 'Industrials',
  },
  {
    symbol: 'RTX',
    name: 'RTX Corporation',
    type: 'Stock',
    sector: 'Industrials',
  },
  {
    symbol: 'DE',
    name: 'Deere & Company',
    type: 'Stock',
    sector: 'Industrials',
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    type: 'ETF',
    sector: 'Large Growth',
  },
  {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    type: 'ETF',
    sector: 'Large Blend',
  },
  {
    symbol: 'ARKK',
    name: 'ARK Innovation ETF',
    type: 'ETF',
    sector: 'Mid-Cap Growth',
  },
  {
    symbol: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    type: 'ETF',
    sector: 'Large Value',
  },
  {
    symbol: 'IBIT',
    name: 'iShares Bitcoin Trust ETF',
    type: 'ETF',
    sector: 'Digital Assets',
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    type: 'ETF',
    sector: 'Large Blend',
  },
  {
    symbol: 'IVV',
    name: 'iShares Core S&P 500 ETF',
    type: 'ETF',
    sector: 'Large Blend',
  },
  {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    type: 'ETF',
    sector: 'Total Market',
  },
  {
    symbol: 'IWM',
    name: 'iShares Russell 2000 ETF',
    type: 'ETF',
    sector: 'Small Blend',
  },
  {
    symbol: 'DIA',
    name: 'SPDR Dow Jones Industrial Average ETF Trust',
    type: 'ETF',
    sector: 'Large Value',
  },
  {
    symbol: 'XLK',
    name: 'Technology Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Technology',
  },
  {
    symbol: 'XLF',
    name: 'Financial Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Financial Services',
  },
  {
    symbol: 'XLE',
    name: 'Energy Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Energy',
  },
  {
    symbol: 'XLV',
    name: 'Health Care Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Healthcare',
  },
  {
    symbol: 'XLY',
    name: 'Consumer Discretionary Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Consumer Cyclical',
  },
  {
    symbol: 'XLP',
    name: 'Consumer Staples Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Consumer Defensive',
  },
  {
    symbol: 'XLI',
    name: 'Industrial Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Industrials',
  },
  {
    symbol: 'XLU',
    name: 'Utilities Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Utilities',
  },
  {
    symbol: 'XLB',
    name: 'Materials Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Basic Materials',
  },
  {
    symbol: 'XLRE',
    name: 'Real Estate Select Sector SPDR Fund',
    type: 'ETF',
    sector: 'Real Estate',
  },
];

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

const launchTotals: Partial<Record<string, { hot: number; not: number }>> = {
  NVDA: { hot: 3079, not: 1139 },
  PLTR: { hot: 3548, not: 351 },
  QQQ: { hot: 2350, not: 625 },
  TSLA: { hot: 2802, not: 985 },
  VOO: { hot: 1855, not: 380 },
  RKLB: { hot: 2158, not: 411 },
  AMD: { hot: 1634, not: 596 },
  ARKK: { hot: 802, not: 1141 },
  AAPL: { hot: 1789, not: 742 },
  SCHD: { hot: 1302, not: 343 },
  GME: { hot: 1220, not: 1451 },
  IBIT: { hot: 1975, not: 702 },
};

export const stocks: Stock[] = catalog.map((instrument, index) => {
  const seeded = launchTotals[instrument.symbol];
  const total = 700 + ((index * 211) % 3600);
  const sentiment = 25 + ((index * 37) % 66);
  const hot = Math.round((total * sentiment) / 100);
  return {
    ...instrument,
    color: palette[index % palette.length],
    hot: seeded?.hot ?? hot,
    not: seeded?.not ?? total - hot,
  };
});

export function score(stock: Stock) {
  return Math.round((stock.hot / (stock.hot + stock.not)) * 100);
}

export function getStock(symbol: string) {
  return stocks.find((stock) => stock.symbol === symbol.toUpperCase());
}
