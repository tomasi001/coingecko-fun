// Mock token price data
export const mockTokenPriceData = {
  ethereum: {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://coin-images.coingecko.com/ethereum.png",
    current_price: 3200.42,
    market_cap: 378692451242,
    market_cap_rank: 2,
    last_updated: new Date().toISOString(),
  },
  aver: {
    id: "aver-ai",
    symbol: "aver",
    name: "Aver AI",
    image: "https://coin-images.coingecko.com/aver.png",
    current_price: 0.0534,
    market_cap: 53400000,
    market_cap_rank: 267,
    last_updated: new Date().toISOString(),
  },
};

// Mock token cache data
export const mockTokenCacheData = {
  ethereum: {
    price: 3200.42,
    lastUpdated: new Date().toISOString(),
  },
  aver: {
    price: 0.0534,
    lastUpdated: new Date().toISOString(),
  },
};

// Mock MongoDB token price entries
export const mockMongoTokenPrices = [
  {
    token: "ethereum",
    price: 3200.42,
    timestamp: new Date(),
  },
  {
    token: "aver-ai",
    price: 0.0534,
    timestamp: new Date(),
  },
];

// Mock OHLC data
export const mockOHLCData = [
  {
    token: "ethereum",
    timestamp: new Date(),
    open: 3100.21,
    high: 3250.47,
    low: 3050.18,
    close: 3200.42,
    volume: 25623789456,
  },
  {
    token: "aver-ai",
    timestamp: new Date(),
    open: 0.051,
    high: 0.056,
    low: 0.049,
    close: 0.0534,
    volume: 7896542,
  },
];

// Mock API responses
export const mockTokenResponse = [
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    price: 3200.42,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "aver-ai",
    name: "Aver AI",
    symbol: "AVER",
    price: 0.0534,
    lastUpdated: new Date().toISOString(),
  },
];

// Mock malicious inputs
export const maliciousInputs = {
  sqlInjection: "'; DROP TABLE tokens; --",
  scriptInjection: '<script>alert("XSS")</script>',
  nonExistentToken: "fake-token",
  invalidDate: "not-a-date",
};
