import { render, screen, waitFor } from "@testing-library/react";
import { TokenProvider, useTokenContext } from "@/context/token-context";
import { useGetTokensData } from "@/utils/api/queries";
import { TokenResponse } from "@/types";
import { ReactNode } from "react";

// Mock the useGetTokensData hook
jest.mock("@/utils/api/queries", () => ({
  useGetTokensData: jest.fn(),
}));

// Sample test data
const mockTokenResponses: TokenResponse[] = [
  {
    tokenId: "ethereum",
    tokenData: {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      image: "/eth.png",
      current_price: 3500,
      price_change_percentage_1h: 0.5,
      price_change_percentage_24h: 2.5,
      price_change_percentage_7d: -1.2,
      total_volume: 20000000000,
      market_cap: 420000000000,
      sparkline_data: [3400, 3450, 3500, 3550, 3520, 3480, 3500],
      ohlcData: [
        {
          timestamp: 1640995200000,
          open: 3400,
          high: 3600,
          low: 3300,
          close: 3500,
          volume: 25000000000,
        },
        {
          timestamp: 1641081600000,
          open: 3500,
          high: 3700,
          low: 3400,
          close: 3650,
          volume: 28000000000,
        },
      ],
    },
  },
  {
    tokenId: "aver-ai",
    tokenData: {
      id: "aver-ai",
      name: "Aver AI",
      symbol: "AVER",
      image: "/aver.png",
      current_price: 0.12,
      price_change_percentage_1h: 1.2,
      price_change_percentage_24h: 5.7,
      price_change_percentage_7d: 15.3,
      total_volume: 5000000,
      market_cap: 50000000,
      sparkline_data: [0.11, 0.115, 0.12, 0.125, 0.122, 0.118, 0.12],
      ohlcData: [
        {
          timestamp: 1640995200000,
          open: 0.11,
          high: 0.13,
          low: 0.1,
          close: 0.12,
          volume: 3000000,
        },
        {
          timestamp: 1641081600000,
          open: 0.12,
          high: 0.14,
          low: 0.11,
          close: 0.13,
          volume: 4000000,
        },
      ],
    },
  },
];

// Test component that uses the context
const TestComponent = () => {
  const {
    tokens,
    ethereumOHLC,
    averOHLC,
    isLoading,
    error,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    paginatedTokens,
  } = useTokenContext();

  return (
    <div>
      <div data-testid="loading-state">
        {isLoading ? "Loading" : "Not Loading"}
      </div>
      <div data-testid="error-state">{error ? error.message : "No Error"}</div>
      <div data-testid="tokens-count">{tokens.length}</div>
      <div data-testid="ethereum-ohlc-count">{ethereumOHLC?.length || 0}</div>
      <div data-testid="aver-ohlc-count">{averOHLC?.length || 0}</div>
      <div data-testid="current-page">{currentPage}</div>
      <div data-testid="items-per-page">{itemsPerPage}</div>
      <div data-testid="paginated-tokens-count">{paginatedTokens.length}</div>
      <button
        onClick={() => setCurrentPage(2)}
        data-testid="change-page-button"
      >
        Change Page
      </button>
      <button
        onClick={() => setItemsPerPage(20)}
        data-testid="change-items-button"
      >
        Change Items Per Page
      </button>
    </div>
  );
};

// Wrapper provider for tests
const wrapper = ({ children }: { children: ReactNode }) => (
  <TokenProvider>{children}</TokenProvider>
);

describe("TokenContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("provides initial state with loading and empty data", () => {
    // Mock loading state
    (useGetTokensData as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    // Render test component with context
    render(<TestComponent />, { wrapper });

    // Assert initial state
    expect(screen.getByTestId("loading-state")).toHaveTextContent("Loading");
    expect(screen.getByTestId("error-state")).toHaveTextContent("No Error");
    expect(screen.getByTestId("tokens-count")).toHaveTextContent("0");
    expect(screen.getByTestId("ethereum-ohlc-count")).toHaveTextContent("0");
    expect(screen.getByTestId("aver-ohlc-count")).toHaveTextContent("0");
    expect(screen.getByTestId("current-page")).toHaveTextContent("1"); // Default page
    expect(screen.getByTestId("items-per-page")).toHaveTextContent("10"); // Default items per page
    expect(screen.getByTestId("paginated-tokens-count")).toHaveTextContent("0");
  });

  it("provides token data when loaded successfully", () => {
    // Mock successful data load
    (useGetTokensData as jest.Mock).mockReturnValue({
      data: mockTokenResponses,
      isLoading: false,
      error: null,
    });

    // Render test component with context
    render(<TestComponent />, { wrapper });

    // Assert loaded state
    expect(screen.getByTestId("loading-state")).toHaveTextContent(
      "Not Loading"
    );
    expect(screen.getByTestId("error-state")).toHaveTextContent("No Error");
    expect(screen.getByTestId("tokens-count")).toHaveTextContent("2");
    expect(screen.getByTestId("ethereum-ohlc-count")).toHaveTextContent("2");
    expect(screen.getByTestId("aver-ohlc-count")).toHaveTextContent("2");
    expect(screen.getByTestId("paginated-tokens-count")).toHaveTextContent("2");
  });

  it("handles error state", () => {
    // Mock error state
    const testError = new Error("API Error");
    (useGetTokensData as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: testError,
    });

    // Render test component with context
    render(<TestComponent />, { wrapper });

    // Assert error state
    expect(screen.getByTestId("loading-state")).toHaveTextContent(
      "Not Loading"
    );
    expect(screen.getByTestId("error-state")).toHaveTextContent("API Error");
    expect(screen.getByTestId("tokens-count")).toHaveTextContent("0");
  });

  it("allows changing pagination settings", async () => {
    // Mock successful data load with many tokens
    const manyTokens = Array(25)
      .fill(null)
      .map((_, i) => ({
        tokenId: `token-${i}`,
        tokenData: {
          id: `token-${i}`,
          name: `Token ${i}`,
          symbol: `TKN${i}`,
          image: `/token-${i}.png`,
          current_price: 100 + i,
          price_change_percentage_1h: 0.1 * i,
          price_change_percentage_24h: 0.2 * i,
          price_change_percentage_7d: 0.3 * i,
          total_volume: 1000000 * (i + 1),
          market_cap: 10000000 * (i + 1),
          sparkline_data: [100, 101, 102],
        },
      }));

    (useGetTokensData as jest.Mock).mockReturnValue({
      data: manyTokens,
      isLoading: false,
      error: null,
    });

    // Render test component with context
    render(<TestComponent />, { wrapper });

    // Initially should show 10 items (default itemsPerPage)
    expect(screen.getByTestId("current-page")).toHaveTextContent("1");
    expect(screen.getByTestId("items-per-page")).toHaveTextContent("10");
    expect(screen.getByTestId("paginated-tokens-count")).toHaveTextContent(
      "10"
    );

    // Change page
    screen.getByTestId("change-page-button").click();

    // Should now show items from page 2
    await waitFor(() => {
      expect(screen.getByTestId("current-page")).toHaveTextContent("2");
      expect(screen.getByTestId("paginated-tokens-count")).toHaveTextContent(
        "10"
      );
    });

    // Change items per page
    screen.getByTestId("change-items-button").click();

    // Should now show 20 items per page
    await waitFor(() => {
      expect(screen.getByTestId("items-per-page")).toHaveTextContent("20");
      // Page 2 with 20 items would show the remaining 5 items (25 total - 20 on first page)
      expect(screen.getByTestId("paginated-tokens-count")).toHaveTextContent(
        "5"
      );
    });
  });

  it("throws error when useTokenContext is used outside provider", () => {
    // Mock console.error to prevent React's error from cluttering test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Expect render to throw error because TestComponent uses useTokenContext but isn't wrapped in TokenProvider
    expect(() => {
      render(<TestComponent />);
    }).toThrow("useTokenContext must be used within a TokenProvider");

    // Restore console.error
    console.error = originalConsoleError;
  });
});
