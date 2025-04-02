import { fetchAndProcessCoinGeckoData } from "@/utils/api/fetchAndProcessCoinGeckoData";
import {
  checkAndUpdateMongoDB,
  fetchFromCoinGecko,
  formatResponseData,
  updateRedisCache,
} from "@/utils";
import { TokenCacheData, TokenData, TokenResponse } from "@/types";

// Mock dependencies
jest.mock("@/utils", () => ({
  checkAndUpdateMongoDB: jest.fn().mockResolvedValue(undefined),
  fetchFromCoinGecko: jest.fn(),
  formatResponseData: jest.fn(),
  updateRedisCache: jest.fn().mockResolvedValue(undefined),
}));

describe("fetchAndProcessCoinGeckoData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should fetch from CoinGecko, update Redis cache, check MongoDB, and format response", async () => {
    // Arrange
    const mockEthereumData: TokenData = {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      image: "https://example.com/eth.png",
      current_price: 3200.42,
      price_change_percentage_1h: 0.5,
      price_change_percentage_24h: 2.3,
      price_change_percentage_7d: -1.2,
      total_volume: 20000000000,
      market_cap: 380000000000,
      sparkline_data: [3100, 3150, 3200, 3250, 3180, 3220, 3200.42],
    };

    const mockAverData: TokenData = {
      id: "aver-ai",
      name: "Aver AI",
      symbol: "AVER",
      image: "https://example.com/aver.png",
      current_price: 0.0534,
      price_change_percentage_1h: 1.2,
      price_change_percentage_24h: 5.7,
      price_change_percentage_7d: 12.3,
      total_volume: 500000,
      market_cap: 20000000,
      sparkline_data: [0.049, 0.051, 0.052, 0.053, 0.0525, 0.0534],
    };

    const mockCacheData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: mockAverData,
    };

    const mockFormattedResponse: TokenResponse[] = [
      { tokenId: "ethereum", tokenData: mockEthereumData },
      { tokenId: "aver-ai", tokenData: mockAverData },
    ];

    // Set up mocks
    (fetchFromCoinGecko as jest.Mock).mockResolvedValue(mockCacheData);
    (formatResponseData as jest.Mock).mockReturnValue(mockFormattedResponse);

    // Act
    const result = await fetchAndProcessCoinGeckoData();

    // Assert
    expect(fetchFromCoinGecko).toHaveBeenCalledTimes(1);
    expect(updateRedisCache).toHaveBeenCalledWith(mockCacheData);
    expect(checkAndUpdateMongoDB).toHaveBeenCalledWith(mockCacheData);
    expect(formatResponseData).toHaveBeenCalledWith(mockCacheData);
    expect(result).toEqual(mockFormattedResponse);
  });

  it("should propagate errors from fetchFromCoinGecko", async () => {
    // Arrange
    const mockError = new Error("CoinGecko API error");
    (fetchFromCoinGecko as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(fetchAndProcessCoinGeckoData()).rejects.toThrow(
      "CoinGecko API error"
    );
    expect(updateRedisCache).not.toHaveBeenCalled();
    expect(checkAndUpdateMongoDB).not.toHaveBeenCalled();
    expect(formatResponseData).not.toHaveBeenCalled();
  });

  it("should handle Redis cache update errors", async () => {
    // Arrange
    const mockCacheData: TokenCacheData = {
      ethereum: {} as TokenData,
      aver: {} as TokenData,
    };
    const mockError = new Error("Redis error");

    (fetchFromCoinGecko as jest.Mock).mockResolvedValue(mockCacheData);
    (updateRedisCache as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(fetchAndProcessCoinGeckoData()).rejects.toThrow("Redis error");
    expect(fetchFromCoinGecko).toHaveBeenCalledTimes(1);
    expect(updateRedisCache).toHaveBeenCalledWith(mockCacheData);
    expect(checkAndUpdateMongoDB).not.toHaveBeenCalled();
    expect(formatResponseData).not.toHaveBeenCalled();
  });

  it("should continue if MongoDB update fails", async () => {
    // Arrange
    const mockCacheData: TokenCacheData = {
      ethereum: {} as TokenData,
      aver: {} as TokenData,
    };
    const mockFormattedResponse: TokenResponse[] = [
      { tokenId: "ethereum", tokenData: {} as TokenData },
      { tokenId: "aver-ai", tokenData: {} as TokenData },
    ];
    const mongoDbError = new Error("MongoDB error");

    (fetchFromCoinGecko as jest.Mock).mockResolvedValue(mockCacheData);
    (updateRedisCache as jest.Mock).mockResolvedValue(undefined);
    (checkAndUpdateMongoDB as jest.Mock).mockRejectedValue(mongoDbError);
    (formatResponseData as jest.Mock).mockReturnValue(mockFormattedResponse);

    // Act - this should not throw despite MongoDB error
    const result = await fetchAndProcessCoinGeckoData();

    // Assert - Should continue despite MongoDB error
    expect(fetchFromCoinGecko).toHaveBeenCalledTimes(1);
    expect(updateRedisCache).toHaveBeenCalledWith(mockCacheData);
    expect(checkAndUpdateMongoDB).toHaveBeenCalledWith(mockCacheData);
    expect(formatResponseData).toHaveBeenCalledWith(mockCacheData);
    expect(console.error).toHaveBeenCalledWith(
      "MongoDB update failed",
      mongoDbError
    );
    expect(result).toEqual(mockFormattedResponse);
  });
});
