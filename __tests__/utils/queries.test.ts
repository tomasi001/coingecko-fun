import {
  getTokensData,
  useGetTokensData as originalUseGetTokensData,
} from "@/utils/api/queries";
import fetchMock from "jest-fetch-mock";
import { useQuery } from "@tanstack/react-query";

// Mock the React Query hook before importing anything else
jest.mock("@tanstack/react-query", () => {
  const useQueryMock = jest.fn();
  return {
    useQuery: useQueryMock,
  };
});

// Mock our own hook
jest.mock("@/utils/api/queries", () => {
  // Keep the original implementation of getTokensData
  const originalModule = jest.requireActual("@/utils/api/queries");

  return {
    ...originalModule,
    // Keep getTokensData, but mock useGetTokensData
    getTokensData: originalModule.getTokensData,
  };
});

describe("API Queries", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();

    // Set up the useQuery mock for each test
    (useQuery as jest.Mock).mockImplementation((options) => ({
      isLoading: false,
      isError: false,
      data: [{ id: "mock-data" }],
      error: null,
      refetchInterval: options.refetchInterval,
      refetchIntervalInBackground: options.refetchIntervalInBackground,
      staleTime: options.staleTime,
      queryFn: options.queryFn,
    }));
  });

  describe("getTokensData", () => {
    it("should fetch and return token data successfully", async () => {
      // Mock the expected response data
      const mockTokenData = [
        {
          id: "ethereum",
          name: "Ethereum",
          symbol: "ETH",
          image: "https://example.com/eth.png",
          current_price: 3200.42,
          price_change_percentage_1h: 0.5,
          price_change_percentage_24h: 2.3,
          price_change_percentage_7d: -1.2,
          history: {
            price: [],
            volume: [],
          },
          last_updated: "2023-01-01T00:00:00Z",
        },
        {
          id: "aver-ai",
          name: "Aver AI",
          symbol: "AVER",
          image: "https://example.com/aver.png",
          current_price: 0.0534,
          price_change_percentage_1h: 1.2,
          price_change_percentage_24h: 5.7,
          price_change_percentage_7d: 12.3,
          history: {
            price: [],
            volume: [],
          },
          last_updated: "2023-01-01T00:00:00Z",
        },
      ];

      // Configure the mock fetch implementation for success case
      fetchMock.mockResponseOnce(JSON.stringify(mockTokenData));

      // Call the function
      const result = await getTokensData();

      // Assertions
      expect(fetchMock).toHaveBeenCalledWith("/api/tokens");
      expect(result).toEqual(mockTokenData);
    });

    it("should throw an error when the API response is not ok", async () => {
      // Configure the mock fetch implementation for error case
      const errorMessage = "API rate limit exceeded";
      fetchMock.mockResponseOnce(JSON.stringify({ message: errorMessage }), {
        status: 400,
      });

      // Call the function and expect it to throw
      await expect(getTokensData()).rejects.toThrow(errorMessage);
      expect(fetchMock).toHaveBeenCalledWith("/api/tokens");
    });

    it("should throw a generic error when no error message is provided", async () => {
      // Configure the mock fetch implementation for error case without specific message
      fetchMock.mockResponseOnce(JSON.stringify({}), { status: 500 });

      // Call the function and expect it to throw
      await expect(getTokensData()).rejects.toThrow(
        "Failed to fetch token data"
      );
      expect(fetchMock).toHaveBeenCalledWith("/api/tokens");
    });
  });

  describe("useGetTokensData", () => {
    it("should have the correct configuration and call useQuery", () => {
      // Call the hook directly
      originalUseGetTokensData();

      // Verify useQuery was called with the right options
      expect(useQuery).toHaveBeenCalledWith({
        queryKey: ["getTokensData"],
        queryFn: expect.any(Function),
        refetchInterval: 30000,
        refetchIntervalInBackground: true,
        staleTime: 25000,
      });
    });

    it("should have a queryFn that calls the API correctly", async () => {
      // Call the hook to trigger useQuery
      originalUseGetTokensData();

      // Get the query function that was passed to useQuery
      const queryFn = (useQuery as jest.Mock).mock.calls[0][0].queryFn;

      // Mock a successful API response
      const mockData = [{ id: "test-token" }];
      fetchMock.mockResponseOnce(JSON.stringify(mockData));

      // Call the query function directly
      const result = await queryFn();

      // Verify it works correctly
      expect(fetchMock).toHaveBeenCalledWith("/api/tokens");
      expect(result).toEqual(mockData);
    });
  });
});
