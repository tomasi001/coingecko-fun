import redisClient, { CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { mockTokenCacheData } from "../__mocks__/data";

// Mock Redis client
jest.mock("@upstash/redis", () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    })),
  };
});

describe("Redis Client", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw an error if Redis credentials are not defined", async () => {
    delete process.env.UPSTASH_REDIS_URL;
    delete process.env.UPSTASH_REDIS_TOKEN;

    expect(() => {
      jest.isolateModules(() => {
        require("@/lib/redis");
      });
    }).toThrow("Please add your Upstash Redis credentials to .env.local");
  });

  it("should create a Redis client with the correct configuration", async () => {
    process.env.UPSTASH_REDIS_URL = "https://example-url.upstash.io";
    process.env.UPSTASH_REDIS_TOKEN = "example-token";

    jest.isolateModules(() => {
      const { Redis } = require("@upstash/redis");
      require("@/lib/redis");
      expect(Redis).toHaveBeenCalledWith({
        url: "https://example-url.upstash.io",
        token: "example-token",
      });
    });
  });
});

describe("Redis Cache Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should store token price data with the correct TTL", async () => {
    // Arrange
    const tokenId = "ethereum";
    const priceData = mockTokenCacheData.ethereum;

    // Act
    await redisClient.set(CACHE_KEYS.ETHEREUM_PRICE, priceData);
    await redisClient.expire(CACHE_KEYS.ETHEREUM_PRICE, CACHE_TTL.PRICE);

    // Assert
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.ETHEREUM_PRICE,
      priceData
    );
    expect(redisClient.expire).toHaveBeenCalledWith(
      CACHE_KEYS.ETHEREUM_PRICE,
      CACHE_TTL.PRICE
    );
  });

  it("should retrieve token price data", async () => {
    // Arrange
    const priceData = mockTokenCacheData.ethereum;
    (redisClient.get as jest.Mock).mockResolvedValue(priceData);

    // Act
    const result = await redisClient.get(CACHE_KEYS.ETHEREUM_PRICE);

    // Assert
    expect(result).toEqual(priceData);
    expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.ETHEREUM_PRICE);
  });

  it("should handle cache misses properly", async () => {
    // Arrange
    (redisClient.get as jest.Mock).mockResolvedValue(null);

    // Act
    const result = await redisClient.get(CACHE_KEYS.ETHEREUM_PRICE);

    // Assert
    expect(result).toBeNull();
    expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.ETHEREUM_PRICE);
  });

  it("should be able to delete cached data", async () => {
    // Act
    await redisClient.del(CACHE_KEYS.ETHEREUM_PRICE);

    // Assert
    expect(redisClient.del).toHaveBeenCalledWith(CACHE_KEYS.ETHEREUM_PRICE);
  });

  it("should handle concurrent cache operations", async () => {
    // Arrange
    const priceData1 = mockTokenCacheData.ethereum;
    const priceData2 = mockTokenCacheData.aver;

    // Act
    await Promise.all([
      redisClient.set(CACHE_KEYS.ETHEREUM_PRICE, priceData1),
      redisClient.set(CACHE_KEYS.AVER_PRICE, priceData2),
    ]);

    // Assert
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.ETHEREUM_PRICE,
      priceData1
    );
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.AVER_PRICE,
      priceData2
    );
  });

  it("should store and retrieve lock information correctly", async () => {
    // Arrange
    (redisClient.get as jest.Mock).mockResolvedValue("1");

    // Act - Set lock
    await redisClient.set(CACHE_KEYS.MONGO_LOCK, "1");

    // Assert - Set lock
    expect(redisClient.set).toHaveBeenCalledWith(CACHE_KEYS.MONGO_LOCK, "1");

    // Act - Get lock
    const lockValue = await redisClient.get(CACHE_KEYS.MONGO_LOCK);

    // Assert - Get lock
    expect(lockValue).toBe("1");
    expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.MONGO_LOCK);
  });

  it("should handle errors when storing data", async () => {
    // Arrange
    const priceData = mockTokenCacheData.ethereum;
    (redisClient.set as jest.Mock).mockRejectedValueOnce(
      new Error("Redis error")
    );

    // Act & Assert
    await expect(
      redisClient.set(CACHE_KEYS.ETHEREUM_PRICE, priceData)
    ).rejects.toThrow("Redis error");
  });

  it("should handle errors when retrieving data", async () => {
    // Arrange
    (redisClient.get as jest.Mock).mockRejectedValueOnce(
      new Error("Redis error")
    );

    // Act & Assert
    await expect(redisClient.get(CACHE_KEYS.ETHEREUM_PRICE)).rejects.toThrow(
      "Redis error"
    );
  });
});
