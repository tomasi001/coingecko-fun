import { updateMongoDBWithLock } from "@/utils/api/updateMongoDBWithLock";
import clientPromise from "@/lib/mongodb";
import redisClient, { CACHE_KEYS } from "@/lib/redis";
import { TokenCacheData, TokenData } from "@/types";

// Mock dependencies
jest.mock("@/lib/mongodb", () => {
  const mockUpdateOne = jest.fn().mockImplementation(() =>
    Promise.resolve({
      acknowledged: true,
      modifiedCount: 1,
      upsertedId: null,
      upsertedCount: 0,
      matchedCount: 1,
    })
  );

  const mockCollection = {
    updateOne: mockUpdateOne,
    findOne: jest.fn(),
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };

  return {
    __esModule: true,
    default: Promise.resolve({
      db: jest.fn().mockReturnValue(mockDb),
    }),
  };
});

jest.mock("@/lib/redis", () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
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

describe("updateMongoDBWithLock", () => {
  let mockDb: any;
  let mockCollection: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Get references to mocked objects
    const client = await clientPromise;
    mockDb = client.db();
    mockCollection = mockDb.collection();

    // Default to successful lock acquisition
    (redisClient.set as jest.Mock).mockImplementation((key) => {
      return Promise.resolve("OK");
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should update MongoDB with both tokens when available", async () => {
    // Arrange
    const currentTime = 1617649200000;

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
    await updateMongoDBWithLock(cacheData, currentTime);

    // Assert
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.MONGO_LOCK,
      "locked",
      { nx: true, ex: 1 }
    );

    expect(mockDb.collection).toHaveBeenCalledWith("tokens");

    expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.LAST_MONGO_UPDATE,
      currentTime.toString()
    );

    expect(redisClient.del).toHaveBeenCalledWith(CACHE_KEYS.MONGO_LOCK);
  });

  it("should update MongoDB with only ethereum when aver is null", async () => {
    // Arrange
    const currentTime = 1617649200000;

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
    await updateMongoDBWithLock(cacheData, currentTime);

    // Assert
    expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
    expect(mockCollection.updateOne).not.toHaveBeenCalledWith(
      { token: "aver-ai" },
      expect.anything(),
      expect.anything()
    );
  });

  it("should update MongoDB with only aver when ethereum is null", async () => {
    // Arrange
    const currentTime = 1617649200000;

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
    await updateMongoDBWithLock(cacheData, currentTime);

    // Assert
    expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
    expect(mockCollection.updateOne).not.toHaveBeenCalledWith(
      { token: "ethereum" },
      expect.anything(),
      expect.anything()
    );
  });

  it("should handle lock failure gracefully", async () => {
    // Arrange
    jest.clearAllMocks();

    // Mock Redis to fail acquiring lock
    (redisClient.set as jest.Mock).mockResolvedValueOnce(null);

    const currentTime = 1617649200000;
    const cacheData: TokenCacheData = { ethereum: null, aver: null };

    // Act
    await updateMongoDBWithLock(cacheData, currentTime);

    // Assert - key assertions that should be true regardless of implementation
    expect(redisClient.set).toHaveBeenCalledWith(
      CACHE_KEYS.MONGO_LOCK,
      "locked",
      { nx: true, ex: 1 }
    );

    // If the lock isn't acquired, we shouldn't try to access MongoDB or update the cache
    expect(mockDb.collection).not.toHaveBeenCalled();
    expect(redisClient.del).not.toHaveBeenCalled();
  });

  it("should release lock if MongoDB update fails", async () => {
    // Arrange
    const currentTime = 1617649200000;
    const mockError = new Error("MongoDB update error");
    mockCollection.updateOne.mockRejectedValue(mockError);

    const cacheData: TokenCacheData = {
      ethereum: {} as TokenData,
      aver: null,
    };

    // Act
    await updateMongoDBWithLock(cacheData, currentTime);

    // Assert
    expect(console.error).toHaveBeenCalled();
    expect(redisClient.del).toHaveBeenCalledWith(CACHE_KEYS.MONGO_LOCK);
  });

  it("should handle Redis timestamp update failure", async () => {
    // Arrange
    jest.clearAllMocks();

    // Success on lock acquisition but failure on timestamp update
    const timestampError = new Error("Redis timestamp error");
    (redisClient.set as jest.Mock).mockImplementation((key) => {
      if (key === CACHE_KEYS.LAST_MONGO_UPDATE) {
        return Promise.reject(timestampError);
      }
      return Promise.resolve("OK");
    });

    const currentTime = 1617649200000;
    const cacheData: TokenCacheData = {
      ethereum: {} as TokenData,
      aver: null,
    };

    // Act
    await updateMongoDBWithLock(cacheData, currentTime);

    // Assert
    expect(console.error).toHaveBeenCalled();
    expect(redisClient.del).toHaveBeenCalledWith(CACHE_KEYS.MONGO_LOCK);
  });
});
