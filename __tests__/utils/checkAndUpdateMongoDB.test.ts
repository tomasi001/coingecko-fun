import { checkAndUpdateMongoDB } from "@/utils/api/checkAndUpdateMongoDB";
import redisClient, { CACHE_KEYS } from "@/lib/redis";
import { updateMongoDBWithLock } from "@/utils";
import { TokenCacheData, TokenData } from "@/types";

// Mock dependencies
jest.mock("@/lib/redis", () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    },
    CACHE_KEYS: {
      ETHEREUM_PRICE: "ethereum:price",
      AVER_PRICE: "aver:price",
      ETHEREUM_OHLC: "ethereum:ohlc",
      AVER_OHLC: "aver:ohlc",
      LAST_MONGO_UPDATE: "lastMongoUpdate",
      MONGO_LOCK: "mongoUpdateLock",
    },
  };
});

jest.mock("@/utils", () => ({
  updateMongoDBWithLock: jest.fn().mockResolvedValue(undefined),
}));

describe("checkAndUpdateMongoDB", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(Date, "now").mockImplementation(() => 1617649200000); // Mock current time
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should update MongoDB if no previous update timestamp exists", async () => {
    // Arrange
    (redisClient.get as jest.Mock).mockResolvedValue(null);

    const mockData: TokenCacheData = {
      ethereum: {
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
      } as TokenData,
      aver: null,
    };

    // Act
    await checkAndUpdateMongoDB(mockData);

    // Assert
    expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.LAST_MONGO_UPDATE);
    expect(updateMongoDBWithLock).toHaveBeenCalledWith(mockData, 1617649200000);
  });

  it("should update MongoDB if the last update was more than 60 seconds ago", async () => {
    // Arrange
    const currentTime = 1617649200000;
    const lastUpdateTime = currentTime - 61000; // 61 seconds ago

    (redisClient.get as jest.Mock).mockResolvedValue(lastUpdateTime.toString());

    const mockData: TokenCacheData = {
      ethereum: {
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
      } as TokenData,
      aver: null,
    };

    // Act
    await checkAndUpdateMongoDB(mockData);

    // Assert
    expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.LAST_MONGO_UPDATE);
    expect(updateMongoDBWithLock).toHaveBeenCalledWith(mockData, currentTime);
  });

  it("should not update MongoDB if the last update was less than 60 seconds ago", async () => {
    // Arrange
    const currentTime = 1617649200000;
    const lastUpdateTime = currentTime - 59000; // 59 seconds ago

    (redisClient.get as jest.Mock).mockResolvedValue(lastUpdateTime.toString());

    const mockData: TokenCacheData = {
      ethereum: {
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
      } as TokenData,
      aver: null,
    };

    // Act
    await checkAndUpdateMongoDB(mockData);

    // Assert
    expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.LAST_MONGO_UPDATE);
    expect(updateMongoDBWithLock).not.toHaveBeenCalled();
  });

  it("should handle Redis errors gracefully", async () => {
    // Arrange
    const mockError = new Error("Redis connection error");
    (redisClient.get as jest.Mock).mockRejectedValue(mockError);

    const mockData: TokenCacheData = {
      ethereum: {
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
      } as TokenData,
      aver: null,
    };

    // Act
    await checkAndUpdateMongoDB(mockData);

    // Assert
    expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.LAST_MONGO_UPDATE);
    expect(console.error).toHaveBeenCalledWith(
      "Failed to get lastMongoUpdate from Redis",
      mockError
    );
    expect(updateMongoDBWithLock).toHaveBeenCalledWith(mockData, 1617649200000);
  });
});
