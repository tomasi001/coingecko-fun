import { fetchFromMongoDB } from "@/utils/api/fetchFromMongoDB";
import clientPromise from "@/lib/mongodb";
import { TokenData } from "@/types";

// Mock the MongoDB client
jest.mock("@/lib/mongodb", () => {
  const mockCollection = {
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

describe("fetchFromMongoDB", () => {
  let mockDb: any;
  let mockCollection: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Set up the mock DB and collection for each test
    const client = await clientPromise;
    mockDb = client.db();
    mockCollection = mockDb.collection();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should fetch token data from MongoDB successfully", async () => {
    // Arrange
    const mockEthereumDoc = {
      _id: "eth_id",
      token: "ethereum",
      timestamp: new Date(),
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

    const mockAverDoc = {
      _id: "aver_id",
      token: "aver-ai",
      timestamp: new Date(),
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

    mockCollection.findOne.mockImplementation((query: any) => {
      if (query.token === "ethereum") return Promise.resolve(mockEthereumDoc);
      if (query.token === "aver-ai") return Promise.resolve(mockAverDoc);
      return Promise.resolve(null);
    });

    // Act
    const result = await fetchFromMongoDB();

    // Assert
    expect(mockDb.collection).toHaveBeenCalledWith("tokens");
    expect(mockCollection.findOne).toHaveBeenCalledWith({ token: "ethereum" });
    expect(mockCollection.findOne).toHaveBeenCalledWith({ token: "aver-ai" });

    // Check the returned data has MongoDB-specific fields removed
    expect(result.ethereum).not.toBeNull();
    expect(result.ethereum?._id).toBeUndefined();
    expect(result.ethereum?.token).toBeUndefined();
    expect(result.ethereum?.timestamp).toBeUndefined();
    expect(result.ethereum?.id).toBe("ethereum");

    expect(result.aver).not.toBeNull();
    expect(result.aver?._id).toBeUndefined();
    expect(result.aver?.token).toBeUndefined();
    expect(result.aver?.timestamp).toBeUndefined();
    expect(result.aver?.id).toBe("aver-ai");
  });

  it("should handle missing tokens in MongoDB", async () => {
    // Arrange - return null for both tokens
    mockCollection.findOne.mockResolvedValue(null);

    // Act
    const result = await fetchFromMongoDB();

    // Assert
    expect(result.ethereum).toBeNull();
    expect(result.aver).toBeNull();
  });

  it("should handle MongoDB connection errors", async () => {
    // Arrange
    const mockError = new Error("MongoDB connection error");
    mockCollection.findOne.mockRejectedValue(mockError);

    // Act
    const result = await fetchFromMongoDB();

    // Assert
    expect(console.error).toHaveBeenCalledWith(
      "MongoDB fetch failed",
      mockError
    );
    expect(result.ethereum).toBeNull();
    expect(result.aver).toBeNull();
  });

  it("should handle one token existing and one missing", async () => {
    // Arrange
    const mockEthereumDoc = {
      _id: "eth_id",
      token: "ethereum",
      timestamp: new Date(),
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

    mockCollection.findOne.mockImplementation((query: any) => {
      if (query.token === "ethereum") return Promise.resolve(mockEthereumDoc);
      return Promise.resolve(null);
    });

    // Act
    const result = await fetchFromMongoDB();

    // Assert
    expect(result.ethereum).not.toBeNull();
    expect(result.ethereum?.id).toBe("ethereum");
    expect(result.aver).toBeNull();
  });
});
