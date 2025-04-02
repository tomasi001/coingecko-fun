import { fetchAndProcessMongoDBData } from "@/utils/api/fetchAndProcessMongoDBData";
import {
  fetchFromMongoDB,
  formatResponseData,
  updateRedisWithMongoData,
} from "@/utils";
import { TokenCacheData, TokenData, TokenResponse } from "@/types";

// Mock dependencies
jest.mock("@/utils", () => ({
  fetchFromMongoDB: jest.fn(),
  formatResponseData: jest.fn(),
  updateRedisWithMongoData: jest.fn().mockResolvedValue(undefined),
}));

describe("fetchAndProcessMongoDBData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch from MongoDB, update Redis, and format response", async () => {
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

    const mockMongoData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: mockAverData,
    };

    const mockFormattedResponse: TokenResponse[] = [
      { tokenId: "ethereum", tokenData: mockEthereumData },
      { tokenId: "aver-ai", tokenData: mockAverData },
    ];

    // Set up mocks
    (fetchFromMongoDB as jest.Mock).mockResolvedValue(mockMongoData);
    (formatResponseData as jest.Mock).mockReturnValue(mockFormattedResponse);

    // Act
    const result = await fetchAndProcessMongoDBData();

    // Assert
    expect(fetchFromMongoDB).toHaveBeenCalledTimes(1);
    expect(updateRedisWithMongoData).toHaveBeenCalledWith(mockMongoData);
    expect(formatResponseData).toHaveBeenCalledWith(mockMongoData);
    expect(result).toEqual(mockFormattedResponse);
  });

  it("should throw error when MongoDB data is incomplete (missing ethereum)", async () => {
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

    const incompleteMongoData: TokenCacheData = {
      ethereum: null,
      aver: mockAverData,
    };

    (fetchFromMongoDB as jest.Mock).mockResolvedValue(incompleteMongoData);

    // Act & Assert
    await expect(fetchAndProcessMongoDBData()).rejects.toThrow(
      "MongoDB data incomplete"
    );
    expect(fetchFromMongoDB).toHaveBeenCalledTimes(1);
    expect(updateRedisWithMongoData).not.toHaveBeenCalled();
    expect(formatResponseData).not.toHaveBeenCalled();
  });

  it("should throw error when MongoDB data is incomplete (missing aver)", async () => {
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

    const incompleteMongoData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: null,
    };

    (fetchFromMongoDB as jest.Mock).mockResolvedValue(incompleteMongoData);

    // Act & Assert
    await expect(fetchAndProcessMongoDBData()).rejects.toThrow(
      "MongoDB data incomplete"
    );
    expect(fetchFromMongoDB).toHaveBeenCalledTimes(1);
    expect(updateRedisWithMongoData).not.toHaveBeenCalled();
    expect(formatResponseData).not.toHaveBeenCalled();
  });

  it("should propagate errors from fetchFromMongoDB", async () => {
    // Arrange
    const mockError = new Error("MongoDB connection error");
    (fetchFromMongoDB as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(fetchAndProcessMongoDBData()).rejects.toThrow(
      "MongoDB connection error"
    );
    expect(fetchFromMongoDB).toHaveBeenCalledTimes(1);
    expect(updateRedisWithMongoData).not.toHaveBeenCalled();
    expect(formatResponseData).not.toHaveBeenCalled();
  });

  it("should propagate errors from updateRedisWithMongoData", async () => {
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

    const mockMongoData: TokenCacheData = {
      ethereum: mockEthereumData,
      aver: mockAverData,
    };

    const mockError = new Error("Redis update error");
    (fetchFromMongoDB as jest.Mock).mockResolvedValue(mockMongoData);
    (updateRedisWithMongoData as jest.Mock).mockRejectedValue(mockError);

    // Act & Assert
    await expect(fetchAndProcessMongoDBData()).rejects.toThrow(
      "Redis update error"
    );
    expect(fetchFromMongoDB).toHaveBeenCalledTimes(1);
    expect(updateRedisWithMongoData).toHaveBeenCalledWith(mockMongoData);
    expect(formatResponseData).not.toHaveBeenCalled();
  });
});
