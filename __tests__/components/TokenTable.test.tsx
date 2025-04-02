import { render, screen, fireEvent } from "@testing-library/react";
import TokenTable from "@/components/TokenTable";
import { useTokenContext } from "@/context/token-context";
import { OHLCData, TokenData } from "@/types";

// Mock the token context
jest.mock("@/context/token-context", () => ({
  useTokenContext: jest.fn(),
}));

// Mock the sub-components
jest.mock("@/components/TokenTable/TokenTableHeader", () => {
  return {
    __esModule: true,
    default: () => <thead data-testid="token-table-header" />,
  };
});

jest.mock("@/components/TokenTable/TokenTableBody", () => {
  return {
    __esModule: true,
    default: ({
      onRowClick,
    }: {
      onRowClick: (id: string, name: string) => void;
    }) => (
      <tbody
        data-testid="token-table-body"
        onClick={() => onRowClick("ethereum", "Ethereum")}
      />
    ),
  };
});

describe("TokenTable Component", () => {
  const mockOnTokenSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with header and body", () => {
    // Arrange
    const mockTokens: TokenData[] = [
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "ETH",
        image: "/eth.png",
        current_price: 3500,
        price_change_percentage_1h: 0.5,
        price_change_percentage_24h: 2.3,
        price_change_percentage_7d: -1.2,
        total_volume: 20000000000,
        market_cap: 380000000000,
        sparkline_data: [3100, 3150, 3200, 3250],
      },
    ];

    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: mockTokens,
      isLoading: false,
      error: null,
    });

    // Act
    render(<TokenTable onTokenSelect={mockOnTokenSelect} />);

    // Assert
    expect(screen.getByTestId("token-table-header")).toBeInTheDocument();
    expect(screen.getByTestId("token-table-body")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("calls onTokenSelect when a row is clicked", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
    });

    // Act
    render(<TokenTable onTokenSelect={mockOnTokenSelect} />);

    // Simulate a row click from the mocked TokenTableBody
    fireEvent.click(screen.getByTestId("token-table-body"));

    // Assert
    expect(mockOnTokenSelect).toHaveBeenCalledWith("ethereum", "Ethereum");
  });
});
