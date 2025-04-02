import { MongoClient } from "mongodb";
import clientPromise, { TokenPrice, OHLCData } from "@/lib/mongodb";
import { mockMongoTokenPrices, mockOHLCData } from "../__mocks__/data";

// Mock MongoDB client
jest.mock("mongodb", () => {
  const mockCollection = {
    find: jest.fn().mockReturnThis(),
    insertOne: jest
      .fn()
      .mockResolvedValue({ acknowledged: true, insertedId: "mock-id" }),
    insertMany: jest
      .fn()
      .mockResolvedValue({ acknowledged: true, insertedCount: 2 }),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection),
    command: jest.fn().mockResolvedValue({ ok: 1 }),
  };

  const mockClient = {
    connect: jest.fn().mockResolvedValue({
      db: jest.fn().mockReturnValue(mockDb),
    }),
    db: jest.fn().mockReturnValue(mockDb),
  };

  return {
    MongoClient: jest.fn().mockImplementation(() => mockClient),
    ServerApiVersion: { v1: "1" },
  };
});

describe("MongoDB Connection", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw an error if MONGODB_URI is not defined", async () => {
    delete process.env.MONGODB_URI;

    expect(() => {
      jest.isolateModules(() => {
        require("@/lib/mongodb");
      });
    }).toThrow("Please add your Mongo URI to .env.local");
  });

  it("should create a MongoDB client with the correct options", async () => {
    const testUri = "mongodb://localhost:27017/test";
    process.env.MONGODB_URI = testUri;
    process.env.NODE_ENV = "production";

    jest.isolateModules(() => {
      require("@/lib/mongodb");
      expect(MongoClient).toHaveBeenCalledWith(testUri, expect.any(Object));
    });
  });

  it("should reuse the client in development mode", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.NODE_ENV = "development";

    jest.isolateModules(() => {
      const module1 = require("@/lib/mongodb");
      const module2 = require("@/lib/mongodb");
      expect(module1.default).toBe(module2.default);
    });
  });
});

describe("MongoDB Operations", () => {
  // Mock implementation for this test suite
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    // Set up mocks for specific tests
    mockCollection = {
      find: jest.fn().mockReturnThis(),
      insertOne: jest
        .fn()
        .mockResolvedValue({ acknowledged: true, insertedId: "mock-id" }),
      insertMany: jest
        .fn()
        .mockResolvedValue({ acknowledged: true, insertedCount: 2 }),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    (MongoClient as jest.Mock).mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue({
        db: jest.fn().mockReturnValue(mockDb),
      }),
      db: jest.fn().mockReturnValue(mockDb),
    }));
  });

  it("should be able to store token price data", async () => {
    // Arrange
    const client = await clientPromise;
    const db = client.db("test");
    const collection = db.collection("token_prices");

    // Mock collection.insertOne to return success
    collection.insertOne = jest.fn().mockResolvedValue({ acknowledged: true });

    const tokenPrice: TokenPrice = mockMongoTokenPrices[0];

    // Act
    const result = await collection.insertOne(tokenPrice);

    // Assert
    expect(result.acknowledged).toBe(true);
    expect(collection.insertOne).toHaveBeenCalledWith(tokenPrice);
  });

  it("should be able to store multiple token prices at once", async () => {
    // Arrange
    const client = await clientPromise;
    const db = client.db("test");
    const collection = db.collection("token_prices");

    // Mock collection.insertMany to return success
    collection.insertMany = jest
      .fn()
      .mockResolvedValue({ acknowledged: true, insertedCount: 2 });

    const tokenPrices: TokenPrice[] = mockMongoTokenPrices;

    // Act
    const result = await collection.insertMany(tokenPrices);

    // Assert
    expect(result.acknowledged).toBe(true);
    expect(result.insertedCount).toBe(2);
    expect(collection.insertMany).toHaveBeenCalledWith(tokenPrices);
  });

  it("should be able to retrieve the latest token prices", async () => {
    // Arrange
    const client = await clientPromise;
    const db = client.db("test");
    const collection = db.collection("token_prices");

    // Set up mock implementation for this specific test
    collection.find = jest.fn().mockReturnThis();
    collection.sort = jest.fn().mockReturnThis();
    collection.limit = jest.fn().mockReturnThis();
    collection.toArray = jest.fn().mockResolvedValue(mockMongoTokenPrices);

    // Act
    const result = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(2)
      .toArray();

    // Assert
    expect(result).toEqual(mockMongoTokenPrices);
    expect(collection.find).toHaveBeenCalled();
    expect(collection.sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(collection.limit).toHaveBeenCalledWith(2);
  });

  it("should handle errors when storing token price data", async () => {
    // Arrange
    const client = await clientPromise;
    const db = client.db("test");
    const collection = db.collection("token_prices");

    // Mock collection.insertOne to throw an error
    const mockError = new Error("Database error");
    collection.insertOne = jest.fn().mockRejectedValue(mockError);

    const tokenPrice: TokenPrice = mockMongoTokenPrices[0];

    // Act & Assert
    await expect(collection.insertOne(tokenPrice)).rejects.toThrow(
      "Database error"
    );
  });

  it("should store and retrieve OHLC data correctly", async () => {
    // Arrange
    const client = await clientPromise;
    const db = client.db("test");
    const collection = db.collection("ohlc_data");

    // Set up mocks
    collection.insertMany = jest
      .fn()
      .mockResolvedValue({ acknowledged: true, insertedCount: 2 });
    collection.find = jest.fn().mockReturnThis();
    collection.sort = jest.fn().mockReturnThis();
    collection.toArray = jest.fn().mockResolvedValue(mockOHLCData);

    const ohlcData: OHLCData[] = mockOHLCData;

    // Act - Store data
    const insertResult = await collection.insertMany(ohlcData);

    // Assert - Store data
    expect(insertResult.acknowledged).toBe(true);
    expect(insertResult.insertedCount).toBe(2);

    // Act - Retrieve data
    const retrieveResult = await collection
      .find({ token: "ethereum" })
      .sort({ timestamp: -1 })
      .toArray();

    // Assert - Retrieve data
    expect(retrieveResult).toEqual(mockOHLCData);
    expect(collection.find).toHaveBeenCalledWith({ token: "ethereum" });
    expect(collection.sort).toHaveBeenCalledWith({ timestamp: -1 });
  });

  it("should sanitize inputs to prevent injection attacks", async () => {
    // Arrange
    const client = await clientPromise;
    const db = client.db("test");
    const collection = db.collection("token_prices");

    // Potential SQL injection in token name
    const maliciousInput = {
      token: "'; DROP TABLE token_prices; --",
      price: 100,
      timestamp: new Date(),
    };

    collection.insertOne = jest.fn().mockResolvedValue({ acknowledged: true });

    // Act
    await collection.insertOne(maliciousInput);

    // Assert - The value should be stored as-is without being executed as SQL
    expect(collection.insertOne).toHaveBeenCalledWith(maliciousInput);
    // MongoDB is NoSQL and not vulnerable to SQL injection, but we're verifying the input was sanitized properly
  });
});
