import { render, screen, fireEvent } from "@testing-library/react";
import Home from "@/app/page";
import { useTokenContext } from "@/context/token-context";
import { TokenData } from "@/types";

// Mock the components used in the page
jest.mock("@/components", () => ({
  Header: () => <div data-testid="header-component" />,
  TokenTable: ({ onTokenSelect }: { onTokenSelect: Function }) => (
    <div data-testid="token-table-component">
      <button
        data-testid="select-ethereum-button"
        onClick={() => onTokenSelect("ethereum", "Ethereum")}
      >
        Select Ethereum
      </button>
      <button
        data-testid="select-aver-button"
        onClick={() => onTokenSelect("aver-ai", "Aver AI")}
      >
        Select Aver AI
      </button>
    </div>
  ),
  TokenTablePagination: () => <div data-testid="pagination-component" />,
  OHLCChart: ({
    tokenId,
    tokenName,
  }: {
    tokenId: string;
    tokenName: string;
  }) => (
    <div data-testid="ohlc-chart-component">
      Chart for {tokenName} ({tokenId})
    </div>
  ),
}));

// Mock the token context
jest.mock("@/context/token-context", () => ({
  useTokenContext: jest.fn(),
}));

describe("Home Page", () => {
  const mockTokens: TokenData[] = [
    {
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
    },
    {
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
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: mockTokens,
      isLoading: false,
      error: null,
    });
  });

  it("renders the page with header, token table, and pagination", () => {
    // Act
    render(<Home />);

    // Assert
    expect(screen.getByTestId("header-component")).toBeInTheDocument();
    expect(screen.getByTestId("token-table-component")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-component")).toBeInTheDocument();
    expect(
      screen.queryByTestId("ohlc-chart-component")
    ).not.toBeInTheDocument();
  });

  it("shows OHLC chart when a token is selected", () => {
    // Act
    render(<Home />);
    fireEvent.click(screen.getByTestId("select-ethereum-button"));

    // Assert
    const chart = screen.getByTestId("ohlc-chart-component");
    expect(chart).toBeInTheDocument();
    expect(chart.textContent).toContain("Chart for Ethereum (ethereum)");
  });

  it("toggles OHLC chart off when the same token is selected again", () => {
    // Act
    render(<Home />);

    // Select Ethereum
    fireEvent.click(screen.getByTestId("select-ethereum-button"));
    expect(screen.getByTestId("ohlc-chart-component")).toBeInTheDocument();

    // Click Ethereum again to toggle off
    fireEvent.click(screen.getByTestId("select-ethereum-button"));

    // Assert
    expect(
      screen.queryByTestId("ohlc-chart-component")
    ).not.toBeInTheDocument();
  });

  it("changes the selected token when a different token is clicked", () => {
    // Act
    render(<Home />);

    // Select Ethereum first
    fireEvent.click(screen.getByTestId("select-ethereum-button"));
    expect(
      screen.getByText("Chart for Ethereum (ethereum)")
    ).toBeInTheDocument();

    // Then select Aver
    fireEvent.click(screen.getByTestId("select-aver-button"));

    // Assert - should now show Aver chart instead
    expect(screen.getByText("Chart for Aver AI (aver-ai)")).toBeInTheDocument();
    expect(
      screen.queryByText("Chart for Ethereum (ethereum)")
    ).not.toBeInTheDocument();
  });
});
