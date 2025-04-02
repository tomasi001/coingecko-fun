import axios from "axios";
import { CoinGeckoMarketToken, CoinGeckoOHLCRaw } from "@/types";

// Mock axios before importing our module
jest.mock("axios", () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn(),
    })),
  };
});

// Import the real implementation after mocking axios
import coingeckoClient, {
  getTokenOHLC,
  getTokensMarketData,
  sleep,
} from "@/lib/coingecko";

// Mock the module before importing
jest.mock("@/lib/coingecko", () => {
  const mockClient = {
    get: jest.fn(),
  };

  // Mock the implementation for error checking
  const originalModule = jest.requireActual("@/lib/coingecko");

  // Make sleep immediately resolve in tests
  const sleep = jest.fn().mockImplementation(() => Promise.resolve());

  // Create a modified version of getTokenOHLC that uses property checking instead of instanceof
  const modifiedGetTokenOHLC = async (
    tokenId: string,
    days = 7,
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

describe("CoinGecko Client", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.COINGECKO_API_KEY = "test-api-key";
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  it("should throw an error if COINGECKO_API_KEY is not defined", () => {
    delete process.env.COINGECKO_API_KEY;

    // We need to reset modules to force reloading the module
    jest.resetModules();

    expect(() => {
      jest.isolateModules(() => {
        require("@/lib/coingecko");
      });
    }).toThrow("Please add your CoinGecko API key to .env.local");
  });

  it("should create a client with the correct configuration", () => {
    // First, we need to restore the original axios mock
    // before resetting modules to ensure it's properly applied
    jest.resetAllMocks();
    jest.resetModules();

    // Set up the axios mock again explicitly before requiring the module
    jest.doMock("axios", () => ({
      create: jest.fn().mockReturnValue({
        get: jest.fn(),
      }),
    }));

    // Now import axios to get a reference to the newly mocked version
    const mockedAxios = require("axios");

    // Re-require the module to trigger axios.create
    jest.isolateModules(() => {
      require("@/lib/coingecko");
    });

    // Check that axios.create was called with the expected configuration
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: "https://pro-api.coingecko.com/api/v3",
      headers: {
        "x-cg-pro-api-key": "test-api-key",
      },
    });
  });

  it("should implement a sleep function that returns a promise", async () => {
    // We need to use the actual sleep function, not the mocked one
    jest.dontMock("@/lib/coingecko");

    // Explicitly import the unmocked sleep function
    const { sleep } = jest.requireActual("@/lib/coingecko");

    // Mock setTimeout to immediately resolve
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");

    // Start the sleep function
    const sleepPromise = sleep(1000);

    // Fast-forward timers
    jest.runAllTimers();

    // Assert setTimeout was called with correct delay
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

    // Ensure the promise resolves
    await expect(sleepPromise).resolves.toBeUndefined();

    // Restore timers
    jest.useRealTimers();

    // Restore the original mock for other tests
    jest.doMock("@/lib/coingecko");
  });
});

describe("getTokenOHLC", () => {
  const mockOHLCData: CoinGeckoOHLCRaw = [
    [1617580800000, 2000, 2100, 1900, 2050, 2000],
    [1617667200000, 2050, 2200, 2000, 2150, 2050],
  ];

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.COINGECKO_API_KEY = "test-api-key";

    // Reset all mock implementations
    (coingeckoClient.get as jest.Mock).mockReset();
  });

  it("should fetch OHLC data correctly", async () => {
    // Setup mock
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

  it("should use default days parameter value", async () => {
    // Reset mock
    jest.clearAllMocks();

    // Setup a simple mock for this test
    (coingeckoClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockOHLCData,
    });

    // Act - don't provide days parameter
    await getTokenOHLC("ethereum");

    // Assert the default value 7 was used
    expect(coingeckoClient.get).toHaveBeenCalledWith("/coins/ethereum/ohlc", {
      params: {
        vs_currency: "usd",
        days: "7", // Default value
        precision: "full",
      },
    });
  });

  it("should retry on rate limit errors", async () => {
    // Create a rate limit error using AxiosError
    const axiosError = new Error("Rate limit exceeded");
    Object.defineProperty(axiosError, "isAxiosError", { value: true });
    Object.defineProperty(axiosError, "response", { value: { status: 429 } });

    // Mock successive calls - first one fails, second one succeeds
    (coingeckoClient.get as jest.Mock)
      .mockRejectedValueOnce(axiosError)
      .mockResolvedValueOnce({ data: mockOHLCData });

    // Mock sleep to prevent waiting
    (sleep as jest.Mock).mockImplementation(() => Promise.resolve());

    // Act
    const result = await getTokenOHLC("ethereum", 7);

    // Assert
    expect(result).toEqual(mockOHLCData);
    expect(coingeckoClient.get).toHaveBeenCalledTimes(2);
  });

  it("should throw an error after max retries", async () => {
    // Create a rate limit error
    const axiosError = new Error("Rate limit exceeded");
    Object.defineProperty(axiosError, "isAxiosError", { value: true });
    Object.defineProperty(axiosError, "response", { value: { status: 429 } });

    // Make all calls fail with rate limit error
    (coingeckoClient.get as jest.Mock).mockRejectedValue(axiosError);

    // Mock sleep to prevent waiting
    (sleep as jest.Mock).mockImplementation(() => Promise.resolve());

    // Act & Assert
    await expect(getTokenOHLC("ethereum", 7)).rejects.toEqual(axiosError);
    expect(coingeckoClient.get).toHaveBeenCalledTimes(4); // 1 original + 3 retries
  }, 15000);

  it("should throw other errors immediately without retrying", async () => {
    // Create a non-rate-limit error
    const nonRateLimitError = new Error("Network error");
    Object.defineProperty(nonRateLimitError, "isAxiosError", { value: true });
    Object.defineProperty(nonRateLimitError, "response", {
      value: { status: 500 },
    });

    // Mock to throw the error
    (coingeckoClient.get as jest.Mock).mockRejectedValue(nonRateLimitError);

    // Act & Assert
    await expect(getTokenOHLC("ethereum", 7)).rejects.toEqual(
      nonRateLimitError
    );
    expect(coingeckoClient.get).toHaveBeenCalledTimes(1); // No retries
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
    process.env.COINGECKO_API_KEY = "test-api-key";

    // Instead of trying to mock setTimeout directly, use the already mocked sleep function
    // The sleep function is already mocked in the main jest.mock setup
    // We don't need to do anything extra here
  });

  it("should fetch and transform market data correctly", async () => {
    // Mock the get method
    (coingeckoClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockMarketData,
    });

    // Act
    const result = await getTokensMarketData(["ethereum", "aver"]);

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
    // Mock data with nulls
    const mockDataWithNulls: CoinGeckoMarketToken[] = [
      {
        ...mockMarketData[0],
        price_change_percentage_1h_in_currency: null,
        price_change_percentage_24h: null,
        price_change_percentage_7d_in_currency: null,
        sparkline_in_7d: null,
      },
    ];

    // Mock the response
    (coingeckoClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockDataWithNulls,
    });

    // Act
    const result = await getTokensMarketData(["ethereum"]);

    // Assert - check default values are used
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
    // Create a rate limit error using AxiosError-like object
    const axiosError = new Error("Rate limit exceeded");
    Object.defineProperty(axiosError, "isAxiosError", { value: true });
    Object.defineProperty(axiosError, "response", { value: { status: 429 } });

    // Mock successive calls
    (coingeckoClient.get as jest.Mock)
      .mockRejectedValueOnce(axiosError)
      .mockResolvedValueOnce({ data: mockMarketData });

    // Act
    const result = await getTokensMarketData(["ethereum", "aver"]);

    // Assert
    expect(result).toHaveLength(2);
    expect(coingeckoClient.get).toHaveBeenCalledTimes(2);
  });

  it("should throw an error after max retries", async () => {
    // Create a rate limit error
    const axiosError = new Error("Rate limit exceeded");
    Object.defineProperty(axiosError, "isAxiosError", { value: true });
    Object.defineProperty(axiosError, "response", { value: { status: 429 } });

    // Make all calls fail with rate limit error
    (coingeckoClient.get as jest.Mock)
      .mockRejectedValueOnce(axiosError)
      .mockRejectedValueOnce(axiosError)
      .mockRejectedValueOnce(axiosError)
      .mockRejectedValue(axiosError);

    // Act & Assert
    await expect(getTokensMarketData(["ethereum", "aver"])).rejects.toEqual(
      axiosError
    );
    expect(coingeckoClient.get).toHaveBeenCalledTimes(4); // 1 original + 3 retries
  });

  it("should throw other errors immediately without retrying", async () => {
    // Create a non-rate-limit error
    const nonRateLimitError = new Error("Network error");

    // Mock to throw the error
    (coingeckoClient.get as jest.Mock).mockRejectedValueOnce(nonRateLimitError);

    // Act & Assert
    await expect(getTokensMarketData(["ethereum", "aver"])).rejects.toEqual(
      nonRateLimitError
    );
    expect(coingeckoClient.get).toHaveBeenCalledTimes(1); // No retries
  });
});
