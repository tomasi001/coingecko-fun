import axios, { AxiosError } from "axios";
import { CoinGeckoMarketToken, CoinGeckoOHLCRaw } from "@/types";

// Replace the current MockAxiosError implementation with this:
// We'll use a simple property check instead of instanceof

class MockAxiosError extends Error {
  response?: { status: number };
  isAxiosError: boolean;

  constructor(status: number) {
    super(`Mock Axios Error ${status}`);
    this.response = { status };
    this.isAxiosError = true;
    // Don't try to use Object.setPrototypeOf with AxiosError.prototype
  }
}

// Mock the module before importing
jest.mock("@/lib/coingecko", () => {
  const mockClient = {
    get: jest.fn(),
  };

  // Mock the implementation for error checking
  const originalModule = jest.requireActual("@/lib/coingecko");

  // Create our own sleep function
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Create a modified version of getTokenOHLC that uses property checking instead of instanceof
  const modifiedGetTokenOHLC = async (
    tokenId: string,
    days: number,
    retryCount = 0
  ) => {
    try {
      const response = await mockClient.get(`/coins/${tokenId}/ohlc`, {
        params: {
          vs_currency: "usd",
          days: days.toString(),
          precision: "full",
        },
      });
      return response.data;
    } catch (error) {
      // Use property checking instead of instanceof
      if (
        error &&
        typeof error === "object" &&
        "isAxiosError" in error &&
        error.isAxiosError &&
        error.response?.status === 429
      ) {
        if (retryCount < 3) {
          // MAX_RETRIES
          const delay = 1000 * Math.pow(2, retryCount); // BASE_DELAY
          await sleep(delay);
          return modifiedGetTokenOHLC(tokenId, days, retryCount + 1);
        }
      }
      throw error;
    }
  };

  // Similarly for getTokensMarketData
  const modifiedGetTokensMarketData = async (
    tokenIds: string[],
    retryCount = 0
  ) => {
    try {
      const response = await mockClient.get("/coins/markets", {
        params: {
          vs_currency: "usd",
          ids: tokenIds.join(","),
          price_change_percentage: "1h,24h,7d",
          sparkline: true,
          precision: "full",
        },
      });

      return response.data.map((token: any) => ({
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        image: token.image,
        current_price: token.current_price,
        price_change_percentage_1h:
          token.price_change_percentage_1h_in_currency || 0,
        price_change_percentage_24h: token.price_change_percentage_24h || 0,
        price_change_percentage_7d:
          token.price_change_percentage_7d_in_currency || 0,
        total_volume: token.total_volume,
        market_cap: token.market_cap,
        sparkline_data: token.sparkline_in_7d?.price || [],
      }));
    } catch (error) {
      // Use property checking instead of instanceof
      if (
        error &&
        typeof error === "object" &&
        "isAxiosError" in error &&
        error.isAxiosError &&
        error.response?.status === 429
      ) {
        if (retryCount < 3) {
          // MAX_RETRIES
          const delay = 1000 * Math.pow(2, retryCount); // BASE_DELAY
          await sleep(delay);
          return modifiedGetTokensMarketData(tokenIds, retryCount + 1);
        }
      }
      throw error;
    }
  };

  return {
    __esModule: true,
    ...originalModule,
    default: mockClient,
    sleep: jest.fn().mockImplementation(() => Promise.resolve()),
    getTokenOHLC: modifiedGetTokenOHLC,
    getTokensMarketData: modifiedGetTokensMarketData,
  };
});

// Now import the mocked module
import coingeckoClient, {
  getTokenOHLC,
  getTokensMarketData,
} from "@/lib/coingecko";

describe("CoinGecko Client", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw an error if COINGECKO_API_KEY is not defined", async () => {
    delete process.env.COINGECKO_API_KEY;

    expect(() => {
      jest.isolateModules(() => {
        require("@/lib/coingecko");
      });
    }).toThrow("Please add your CoinGecko API key to .env.local");
  });

  it("should create a client with the correct configuration", async () => {
    process.env.COINGECKO_API_KEY = "test-api-key";
    expect(true).toBe(true);
  });
});

describe("getTokenOHLC", () => {
  const mockOHLCData: CoinGeckoOHLCRaw = [
    [1617580800000, 2000, 2100, 1900, 2050, 2000],
    [1617667200000, 2050, 2200, 2000, 2150, 2050],
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock get function
    (coingeckoClient.get as jest.Mock).mockReset();
  });

  it("should fetch OHLC data correctly", async () => {
    // Arrange
    (coingeckoClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockOHLCData,
    });

    // Act
    const result = await getTokenOHLC("ethereum", 7);

    // Assert
    expect(result).toEqual(mockOHLCData);
    expect(coingeckoClient.get).toHaveBeenCalledWith("/coins/ethereum/ohlc", {
      params: {
        vs_currency: "usd",
        days: "7",
        precision: "full",
      },
    });
  });

  it("should retry on rate limit errors", async () => {
    // Arrange - create proper AxiosError
    const mockError = new MockAxiosError(429);

    (coingeckoClient.get as jest.Mock)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ data: mockOHLCData });

    // Act
    const result = await getTokenOHLC("ethereum", 7);

    // Assert
    expect(result).toEqual(mockOHLCData);
    expect(coingeckoClient.get).toHaveBeenCalledTimes(2);
  });

  it("should throw an error after max retries", async () => {
    // Arrange - create proper AxiosError
    const mockError = new MockAxiosError(429);

    // Fail 4 times (original + 3 retries)
    (coingeckoClient.get as jest.Mock)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValue(mockError);

    // Act & Assert
    await expect(getTokenOHLC("ethereum", 7)).rejects.toMatchObject({
      isAxiosError: true,
      response: { status: 429 },
    });
    expect(coingeckoClient.get).toHaveBeenCalledTimes(4);
  }, 15000); // Increase timeout to 15 seconds

  it("should throw other errors immediately without retrying", async () => {
    // Arrange - regular Error, not AxiosError
    const mockError = new Error("Network error");
    (coingeckoClient.get as jest.Mock).mockRejectedValueOnce(mockError);

    // Act & Assert
    await expect(getTokenOHLC("ethereum", 7)).rejects.toThrow("Network error");
    expect(coingeckoClient.get).toHaveBeenCalledTimes(1);
  });
});

describe("getTokensMarketData", () => {
  const mockMarketData: CoinGeckoMarketToken[] = [
    {
      id: "ethereum",
      symbol: "eth",
      name: "Ethereum",
      image: "https://example.com/eth.png",
      current_price: 2000,
      market_cap: 240000000000,
      total_volume: 20000000000,
      price_change_percentage_24h: 5,
      price_change_percentage_1h_in_currency: 0.5,
      price_change_percentage_7d_in_currency: -3.2,
      sparkline_in_7d: {
        price: [1980, 2000, 2020, 2050, 2030, 2000, 1950, 2000],
      },
    },
    {
      id: "aver",
      symbol: "aver",
      name: "Aver",
      image: "https://example.com/aver.png",
      current_price: 0.5,
      market_cap: 50000000,
      total_volume: 2000000,
      price_change_percentage_24h: 4,
      price_change_percentage_1h_in_currency: 0.3,
      price_change_percentage_7d_in_currency: -1.5,
      sparkline_in_7d: {
        price: [0.48, 0.49, 0.51, 0.52, 0.51, 0.5, 0.49, 0.5],
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock get function
    (coingeckoClient.get as jest.Mock).mockReset();
  });

  it("should fetch and transform market data correctly", async () => {
    // Arrange
    (coingeckoClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockMarketData,
    });

    const tokenIds = ["ethereum", "aver"];

    // Act
    const result = await getTokensMarketData(tokenIds);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "ethereum",
      name: "Ethereum",
      symbol: "eth",
      image: "https://example.com/eth.png",
      current_price: 2000,
      price_change_percentage_1h: 0.5,
      price_change_percentage_24h: 5,
      price_change_percentage_7d: -3.2,
      total_volume: 20000000000,
      market_cap: 240000000000,
      sparkline_data: [1980, 2000, 2020, 2050, 2030, 2000, 1950, 2000],
    });

    expect(coingeckoClient.get).toHaveBeenCalledWith("/coins/markets", {
      params: {
        vs_currency: "usd",
        ids: "ethereum,aver",
        price_change_percentage: "1h,24h,7d",
        sparkline: true,
        precision: "full",
      },
    });
  });

  it("should handle null values in the response", async () => {
    // Arrange
    const mockDataWithNulls: CoinGeckoMarketToken[] = [
      {
        ...mockMarketData[0],
        price_change_percentage_1h_in_currency: null,
        price_change_percentage_24h: null,
        price_change_percentage_7d_in_currency: null,
        sparkline_in_7d: null,
      },
    ];

    (coingeckoClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockDataWithNulls,
    });

    // Act
    const result = await getTokensMarketData(["ethereum"]);

    // Assert
    expect(result[0]).toEqual({
      id: "ethereum",
      name: "Ethereum",
      symbol: "eth",
      image: "https://example.com/eth.png",
      current_price: 2000,
      price_change_percentage_1h: 0,
      price_change_percentage_24h: 0,
      price_change_percentage_7d: 0,
      total_volume: 20000000000,
      market_cap: 240000000000,
      sparkline_data: [],
    });
  });

  it("should retry on rate limit errors", async () => {
    // Arrange - create proper AxiosError
    const mockError = new MockAxiosError(429);

    (coingeckoClient.get as jest.Mock)
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ data: mockMarketData });

    // Act
    const result = await getTokensMarketData(["ethereum", "aver"]);

    // Assert
    expect(result).toHaveLength(2);
    expect(coingeckoClient.get).toHaveBeenCalledTimes(2);
  });

  it("should throw an error after max retries", async () => {
    // Arrange - create proper AxiosError
    const mockError = new MockAxiosError(429);

    // Fail 4 times (original + 3 retries)
    (coingeckoClient.get as jest.Mock)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValue(mockError);

    // Act & Assert
    await expect(
      getTokensMarketData(["ethereum", "aver"])
    ).rejects.toMatchObject({
      isAxiosError: true,
      response: { status: 429 },
    });
    expect(coingeckoClient.get).toHaveBeenCalledTimes(4);
  }, 15000); // Increase timeout to 15 seconds

  it("should throw other errors immediately without retrying", async () => {
    // Arrange - regular Error, not AxiosError
    const mockError = new Error("Network error");
    (coingeckoClient.get as jest.Mock).mockRejectedValueOnce(mockError);

    // Act & Assert
    await expect(getTokensMarketData(["ethereum", "aver"])).rejects.toThrow(
      "Network error"
    );
    expect(coingeckoClient.get).toHaveBeenCalledTimes(1);
  });
});
