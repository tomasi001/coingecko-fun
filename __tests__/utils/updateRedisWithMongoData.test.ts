import { updateRedisWithMongoData } from "@/utils/api/updateRedisWithMongoData";
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

describe("updateRedisWithMongoData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update Redis with both tokens when both are available", async () => {
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

    const mongoData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: mockAverData,
    };

    // Act
    await updateRedisWithMongoData(mongoData);

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

  it("should update Redis with only ethereum when aver is null", async () => {
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

    const mongoData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: null,
    };

    // Act
    await updateRedisWithMongoData(mongoData);

    // Assert
    expect(redisClient.set).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.ETHEREUM_PRICE,
      mockEthereumData,
      { ex: CACHE_TTL.PRICE }
    );
  });

  it("should update Redis with only aver when ethereum is null", async () => {
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

    const mongoData: TokenCacheData = {
      ethereum: null,
      aver: mockAverData,
    };

    // Act
    await updateRedisWithMongoData(mongoData);

    // Assert
    expect(redisClient.set).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.AVER_PRICE,
      mockAverData,
      { ex: CACHE_TTL.PRICE }
    );
  });

  it("should do nothing when both tokens are null", async () => {
    // Arrange
    const mongoData: TokenCacheData = {
      ethereum: null,
      aver: null,
    };

    // Act
    await updateRedisWithMongoData(mongoData);

    // Assert
    expect(redisClient.set).not.toHaveBeenCalled();
  });

  it("should propagate Redis errors", async () => {
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

    const mongoData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: null,
    };

    const mockError = new Error("Redis connection error");
    (redisClient.set as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(updateRedisWithMongoData(mongoData)).rejects.toThrow(
      "Redis connection error"
    );
    expect(redisClient.set).toHaveBeenCalledTimes(1);
  });
});
