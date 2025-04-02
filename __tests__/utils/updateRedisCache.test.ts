import { updateRedisCache } from "@/utils/api/updateRedisCache";
import redisClient, { CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { TokenCacheData, TokenData } from "@/types";

// Mock the redis client
jest.mock("@/lib/redis", () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue("OK"),
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
    CACHE_TTL: {
      PRICE: 30,
      OHLC: 300,
    },
  };
});

describe("updateRedisCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should update Redis cache with token data for both tokens", async () => {
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

    const cacheData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: mockAverData,
    };

    // Act
    await updateRedisCache(cacheData);

    // Assert
    expect(redisClient.set).toHaveBeenCalledTimes(2);
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.ETHEREUM_PRICE,
      mockEthereumData,
      { ex: CACHE_TTL.PRICE }
    );
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.AVER_PRICE,
      mockAverData,
      { ex: CACHE_TTL.PRICE }
    );
  });

  it("should update Redis cache with only ethereum data when aver is null", async () => {
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

    const cacheData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: null,
    };

    // Act
    await updateRedisCache(cacheData);

    // Assert
    expect(redisClient.set).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.ETHEREUM_PRICE,
      mockEthereumData,
      { ex: CACHE_TTL.PRICE }
    );
  });

  it("should update Redis cache with only aver data when ethereum is null", async () => {
    // Arrange
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

    const cacheData: TokenCacheData = {
      ethereum: null,
      aver: mockAverData,
    };

    // Act
    await updateRedisCache(cacheData);

    // Assert
    expect(redisClient.set).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.AVER_PRICE,
      mockAverData,
      { ex: CACHE_TTL.PRICE }
    );
  });

  it("should throw and log an error when Redis set fails", async () => {
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

    const cacheData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: null,
    };

    const mockError = new Error("Redis connection error");
    (redisClient.set as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(updateRedisCache(cacheData)).rejects.toThrow(
      "Redis connection error"
    );
    expect(console.error).toHaveBeenCalledWith(
      "Redis cache update failed",
      mockError
    );
  });

  it("should do nothing when both tokens are null", async () => {
    // Arrange
    const cacheData: TokenCacheData = {
      ethereum: null,
      aver: null,
    };

    // Act
    await updateRedisCache(cacheData);

    // Assert
    expect(redisClient.set).not.toHaveBeenCalled();
  });
});
