export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_1h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  total_volume: number;
  market_cap: number;
  sparkline_data: number[];
  ohlcData?: OHLCData; // Add ohlcData as optional field
}

export interface CoinGeckoMarketToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume: number;
  market_cap: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

// Raw OHLC data from CoinGecko (array of arrays)
export type CoinGeckoOHLCRaw = [
  number,
  number,
  number,
  number,
  number,
  number
][];

// Transformed OHLC data for our API response and frontend consumption
export interface OHLCDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number; // Optional because some CoinGecko responses might not include volume
}

// Collection of OHLC data points
export type OHLCData = OHLCDataPoint[];

// For MongoDB storage
export interface OHLCRecord extends Omit<OHLCDataPoint, "timestamp"> {
  token: string;
  timestamp: Date; // Using Date object for MongoDB
}

// API response types
export interface TokenResponse {
  tokenId: string;
  tokenData: TokenData;
}

// Cache structure types
export interface TokenCacheData {
  ethereum: TokenData | null;
  aver: TokenData | null;
}
