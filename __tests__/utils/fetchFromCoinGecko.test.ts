import { fetchFromCoinGecko } from "@/utils/api/fetchFromCoinGecko";
import { getTokenOHLC, getTokensMarketData } from "@/lib/coingecko";
import {
  CoinGeckoMarketToken,
  CoinGeckoOHLCRaw,
  TokenCacheData,
} from "@/types";

// Mock the CoinGecko library
jest.mock("@/lib/coingecko", () => ({
  getTokenOHLC: jest.fn(),
  getTokensMarketData: jest.fn(),
}));

describe("fetchFromCoinGecko", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should fetch and transform data from CoinGecko successfully", async () => {
    // Arrange
    const mockMarketData: CoinGeckoMarketToken[] = [
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "ETH",
        image: "https://example.com/eth.png",
        current_price: 3200.42,
        price_change_percentage_1h_in_currency: 0.5,
        price_change_percentage_24h: 2.3,
        price_change_percentage_7d_in_currency: -1.2,
        total_volume: 20000000000,
        market_cap: 380000000000,
        sparkline_in_7d: {
          price: [3100, 3150, 3200, 3250, 3180, 3220, 3200.42],
        },
      },
      {
        id: "aver-ai",
        name: "Aver AI",
        symbol: "AVER",
        image: "https://example.com/aver.png",
        current_price: 0.0534,
        price_change_percentage_1h_in_currency: 1.2,
        price_change_percentage_24h: 5.7,
        price_change_percentage_7d_in_currency: 12.3,
        total_volume: 500000,
        market_cap: 20000000,
        sparkline_in_7d: {
          price: [0.049, 0.051, 0.052, 0.053, 0.0525, 0.0534],
        },
      },
    ];

    const mockEthereumOHLC: CoinGeckoOHLCRaw = [
      [1617649200000, 3100, 3200, 3000, 3150, 10000000],
      [1617735600000, 3150, 3250, 3100, 3200, 12000000],
      [1617822000000, 3200, 3300, 3150, 3250, 15000000],
    ];

    const mockAverOHLC: CoinGeckoOHLCRaw = [
      [1617649200000, 0.049, 0.052, 0.048, 0.051, 300000],
      [1617735600000, 0.051, 0.054, 0.05, 0.052, 400000],
      [1617822000000, 0.052, 0.055, 0.051, 0.0534, 500000],
    ];

    // Mock the CoinGecko API functions
    (getTokensMarketData as jest.Mock).mockResolvedValue(mockMarketData);
    (getTokenOHLC as jest.Mock).mockImplementation((token: string) => {
      if (token === "ethereum") return Promise.resolve(mockEthereumOHLC);
      if (token === "aver-ai") return Promise.resolve(mockAverOHLC);
      return Promise.reject(new Error("Unknown token"));
    });

    // Act
    const result: TokenCacheData = await fetchFromCoinGecko();

    // Assert
    expect(getTokensMarketData).toHaveBeenCalledWith(["ethereum", "aver-ai"]);
    expect(getTokenOHLC).toHaveBeenCalledWith("ethereum", 7);
    expect(getTokenOHLC).toHaveBeenCalledWith("aver-ai", 7);

    // Verify ethereum data
    expect(result.ethereum).not.toBeNull();
    expect(result.ethereum?.id).toBe("ethereum");
    expect(result.ethereum?.current_price).toBe(3200.42);
    expect(result.ethereum?.ohlcData).toHaveLength(3);
    expect(result.ethereum?.ohlcData?.[0]).toEqual({
      timestamp: 1617649200000,
      open: 3100,
      high: 3200,
      low: 3000,
      close: 3150,
      volume: 10000000,
    });

    // Verify aver data
    expect(result.aver).not.toBeNull();
    expect(result.aver?.id).toBe("aver-ai");
    expect(result.aver?.current_price).toBe(0.0534);
    expect(result.aver?.ohlcData).toHaveLength(3);
    expect(result.aver?.ohlcData?.[2]).toEqual({
      timestamp: 1617822000000,
      open: 0.052,
      high: 0.055,
      low: 0.051,
      close: 0.0534,
      volume: 500000,
    });
  });

  it("should handle missing tokens in the market data", async () => {
    // Arrange - only ethereum exists in response
    const mockMarketData: CoinGeckoMarketToken[] = [
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "ETH",
        image: "https://example.com/eth.png",
        current_price: 3200.42,
        price_change_percentage_1h_in_currency: 0.5,
        price_change_percentage_24h: 2.3,
        price_change_percentage_7d_in_currency: -1.2,
        total_volume: 20000000000,
        market_cap: 380000000000,
        sparkline_in_7d: {
          price: [3100, 3150, 3200, 3250, 3180, 3220, 3200.42],
        },
      },
    ];

    const mockEthereumOHLC: CoinGeckoOHLCRaw = [
      [1617649200000, 3100, 3200, 3000, 3150, 10000000],
      [1617735600000, 3150, 3250, 3100, 3200, 12000000],
    ];

    const mockAverOHLC: CoinGeckoOHLCRaw = [
      [1617649200000, 0.049, 0.052, 0.048, 0.051, 300000],
      [1617735600000, 0.051, 0.054, 0.05, 0.052, 400000],
    ];

    // Mock the CoinGecko API functions
    (getTokensMarketData as jest.Mock).mockResolvedValue(mockMarketData);
    (getTokenOHLC as jest.Mock).mockImplementation((token: string) => {
      if (token === "ethereum") return Promise.resolve(mockEthereumOHLC);
      if (token === "aver-ai") return Promise.resolve(mockAverOHLC);
      return Promise.reject(new Error("Unknown token"));
    });

    // Act
    const result: TokenCacheData = await fetchFromCoinGecko();

    // Assert
    expect(result.ethereum).not.toBeNull();
    expect(result.aver).toBeNull();
  });

  it("should handle CoinGecko API errors and rethrow", async () => {
    // Arrange
    const mockError = new Error("CoinGecko API error");
    (getTokensMarketData as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(fetchFromCoinGecko()).rejects.toThrow("CoinGecko API error");
    expect(console.error).toHaveBeenCalledWith(
      "CoinGecko fetch failed",
      mockError
    );
  });

  it("should handle empty OHLC data", async () => {
    // Arrange
    const mockMarketData: CoinGeckoMarketToken[] = [
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "ETH",
        image: "https://example.com/eth.png",
        current_price: 3200.42,
        price_change_percentage_1h_in_currency: 0.5,
        price_change_percentage_24h: 2.3,
        price_change_percentage_7d_in_currency: -1.2,
        total_volume: 20000000000,
        market_cap: 380000000000,
        sparkline_in_7d: {
          price: [3100, 3150, 3200, 3250, 3180, 3220, 3200.42],
        },
      },
      {
        id: "aver-ai",
        name: "Aver AI",
        symbol: "AVER",
        image: "https://example.com/aver.png",
        current_price: 0.0534,
        price_change_percentage_1h_in_currency: 1.2,
        price_change_percentage_24h: 5.7,
        price_change_percentage_7d_in_currency: 12.3,
        total_volume: 500000,
        market_cap: 20000000,
        sparkline_in_7d: {
          price: [0.049, 0.051, 0.052, 0.053, 0.0525, 0.0534],
        },
      },
    ];

    // Empty OHLC arrays
    const emptyOHLC: CoinGeckoOHLCRaw = [];

    // Mock the CoinGecko API functions
    (getTokensMarketData as jest.Mock).mockResolvedValue(mockMarketData);
    (getTokenOHLC as jest.Mock).mockResolvedValue(emptyOHLC);

    // Act
    const result: TokenCacheData = await fetchFromCoinGecko();

    // Assert
    expect(result.ethereum).not.toBeNull();
    expect(result.ethereum?.ohlcData).toEqual([]);
    expect(result.aver).not.toBeNull();
    expect(result.aver?.ohlcData).toEqual([]);
  });
});
