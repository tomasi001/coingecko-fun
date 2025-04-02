import * as utils from "@/utils";
import { GET } from "@/app/api/tokens/route";
import { mockTokenCacheData, mockTokenResponse } from "../../../__mocks__/data";

// Mock the Next.js module
jest.mock("next/server", () => {
  return {
    NextResponse: {
      json: jest.fn().mockImplementation((data, options) => {
        return {
          status: options?.status || 200,
          data,
          async json() {
            return data;
          },
        };
      }),
    },
  };
});

// Mock the utility functions
jest.mock("@/utils", () => ({
  fetchFromRedis: jest.fn(),
  fetchAndProcessCoinGeckoData: jest.fn(),
  fetchAndProcessMongoDBData: jest.fn(),
  formatResponseData: jest.fn(),
}));

describe("Tokens API Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return cached data from Redis when available", async () => {
    // Arrange
    const cachedData = mockTokenCacheData;
    const formattedData = mockTokenResponse;

    // Mock implementations
    (utils.fetchFromRedis as jest.Mock).mockResolvedValue(cachedData);
    (utils.formatResponseData as jest.Mock).mockReturnValue(formattedData);

    // Act
    const response = await GET();
    const responseData = await response.json();

    // Assert
    expect(utils.fetchFromRedis).toHaveBeenCalled();
    expect(utils.formatResponseData).toHaveBeenCalledWith(cachedData);
    expect(utils.fetchAndProcessCoinGeckoData).not.toHaveBeenCalled();
    expect(utils.fetchAndProcessMongoDBData).not.toHaveBeenCalled();
    expect(responseData).toEqual(formattedData);
    expect(response.status).toBe(200);
  });

  it("should fetch data from CoinGecko when Redis cache is empty", async () => {
    // Arrange
    const emptyCache = { ethereum: null, aver: null };
    const formattedData = mockTokenResponse;

    // Mock implementations
    (utils.fetchFromRedis as jest.Mock).mockResolvedValue(emptyCache);
    (utils.fetchAndProcessCoinGeckoData as jest.Mock).mockResolvedValue(
      formattedData
    );

    // Act
    const response = await GET();
    const responseData = await response.json();

    // Assert
    expect(utils.fetchFromRedis).toHaveBeenCalled();
    expect(utils.fetchAndProcessCoinGeckoData).toHaveBeenCalled();
    expect(utils.fetchAndProcessMongoDBData).not.toHaveBeenCalled();
    expect(responseData).toEqual(formattedData);
    expect(response.status).toBe(200);
  });

  it("should fall back to MongoDB when CoinGecko API fails", async () => {
    // Arrange
    const emptyCache = { ethereum: null, aver: null };
    const formattedData = mockTokenResponse;

    // Mock implementations
    (utils.fetchFromRedis as jest.Mock).mockResolvedValue(emptyCache);
    (utils.fetchAndProcessCoinGeckoData as jest.Mock).mockRejectedValue(
      new Error("CoinGecko API error")
    );
    (utils.fetchAndProcessMongoDBData as jest.Mock).mockResolvedValue(
      formattedData
    );

    // Act
    const response = await GET();
    const responseData = await response.json();

    // Assert
    expect(utils.fetchFromRedis).toHaveBeenCalled();
    expect(utils.fetchAndProcessCoinGeckoData).toHaveBeenCalled();
    expect(utils.fetchAndProcessMongoDBData).toHaveBeenCalled();
    expect(responseData).toEqual(formattedData);
    expect(response.status).toBe(200);
  });

  it("should return a 500 error when all data sources fail", async () => {
    // Arrange
    const emptyCache = { ethereum: null, aver: null };

    // Mock implementations
    (utils.fetchFromRedis as jest.Mock).mockResolvedValue(emptyCache);
    (utils.fetchAndProcessCoinGeckoData as jest.Mock).mockRejectedValue(
      new Error("CoinGecko API error")
    );
    (utils.fetchAndProcessMongoDBData as jest.Mock).mockRejectedValue(
      new Error("MongoDB error")
    );

    // Act
    const response = await GET();
    const responseData = await response.json();

    // Assert
    expect(utils.fetchFromRedis).toHaveBeenCalled();
    expect(utils.fetchAndProcessCoinGeckoData).toHaveBeenCalled();
    expect(utils.fetchAndProcessMongoDBData).toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(responseData).toEqual({
      message: "Unable to retrieve token data from any source",
    });
  });

  it("should handle general errors in the API", async () => {
    // Arrange
    (utils.fetchFromRedis as jest.Mock).mockRejectedValue(
      new Error("Unexpected error")
    );

    // Act
    const response = await GET();
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(responseData).toEqual({ message: "Internal server error" });
  });
});
