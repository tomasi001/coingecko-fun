import { fetchFromRedis } from "@/utils/api/fetchFromRedis";
import redisClient, { CACHE_KEYS } from "@/lib/redis";
import { TokenData } from "@/types";

// Mock the redis client
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
    CACHE_TTL: {
      PRICE: 30,
      OHLC: 300,
    },
  };
});

describe("fetchFromRedis", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should fetch token data from Redis when data exists", async () => {
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

    // Mock Redis get to return data
    (redisClient.get as jest.Mock).mockImplementation((key: string) => {
      if (key === CACHE_KEYS.ETHEREUM_PRICE) {
        return Promise.resolve(mockEthereumData);
      } else if (key === CACHE_KEYS.AVER_PRICE) {
        return Promise.resolve(mockAverData);
      }
      return Promise.resolve(null);
    });

    // Act
    const result = await fetchFromRedis();

    // Assert
    expect(redisClient.get).toHaveBeenCalledTimes(2);
    expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.ETHEREUM_PRICE);
    expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.AVER_PRICE);
    expect(result.ethereum).toEqual(mockEthereumData);
    expect(result.aver).toEqual(mockAverData);
  });

  it("should return nulls when token data doesn't exist in Redis", async () => {
    // Arrange
    (redisClient.get as jest.Mock).mockResolvedValue(null);

    // Act
    const result = await fetchFromRedis();

    // Assert
    expect(redisClient.get).toHaveBeenCalledTimes(2);
    expect(result.ethereum).toBeNull();
    expect(result.aver).toBeNull();
  });

  it("should return nulls and log error when Redis throws an exception", async () => {
    // Arrange
    (redisClient.get as jest.Mock).mockRejectedValue(
      new Error("Redis connection error")
    );

    // Act
    const result = await fetchFromRedis();

    // Assert
    expect(redisClient.get).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(
      "Redis fetch failed",
      expect.any(Error)
    );
    expect(result.ethereum).toBeNull();
    expect(result.aver).toBeNull();
  });

  it("should handle one token existing and one missing", async () => {
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

    // Mock Redis get to return data only for Ethereum
    (redisClient.get as jest.Mock).mockImplementation((key: string) => {
      if (key === CACHE_KEYS.ETHEREUM_PRICE) {
        return Promise.resolve(mockEthereumData);
      } else {
        return Promise.resolve(null);
      }
    });

    // Act
    const result = await fetchFromRedis();

    // Assert
    expect(redisClient.get).toHaveBeenCalledTimes(2);
    expect(result.ethereum).toEqual(mockEthereumData);
    expect(result.aver).toBeNull();
  });
});
