import { render, screen, fireEvent } from "@testing-library/react";
import TokenTableBody from "@/components/TokenTable/TokenTableBody";
import { useTokenContext } from "@/context/token-context";
import { TokenData } from "@/types";

// Mock the token context
jest.mock("@/context/token-context", () => ({
  useTokenContext: jest.fn(),
}));

// Mock the components used in TokenTableBody
jest.mock("@/components/TokenTable/TokenTableError", () => ({
  __esModule: true,
  default: () => <div data-testid="token-table-error" />,
}));

jest.mock("@/components/TokenTable/TokenTableLoading", () => ({
  __esModule: true,
  default: () => <div data-testid="token-table-loading" />,
}));

jest.mock("@/components", () => ({
  PriceChange: ({ value }: { value: number }) => (
    <div data-testid="price-change">{value}</div>
  ),
  Sparkline: ({ data }: { data: number[] }) => (
    <div data-testid="sparkline">{data.join(",")}</div>
  ),
  OHLCSparkline: ({ data, isLoading }: { data: any; isLoading: boolean }) => (
    <div data-testid="ohlc-sparkline">
      {isLoading ? "Loading" : "OHLC Data"}
    </div>
  ),
}));

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => (
    <img
      src={props.src}
      alt={props.alt}
      width={props.width}
      height={props.height}
      data-testid="token-image"
      {...props}
    />
  ),
}));

describe("TokenTableBody Component", () => {
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
    {
      id: "aver-ai",
      name: "Aver AI",
      symbol: "AVER",
      image: "/aver.png",
      current_price: 0.12,
      price_change_percentage_1h: -0.2,
      price_change_percentage_24h: 5.7,
      price_change_percentage_7d: 10.3,
      total_volume: 500000,
      market_cap: 12000000,
      sparkline_data: [0.11, 0.115, 0.118, 0.12],
    },
  ];

  const mockOHLCData = [
    [1616629200000, 51500, 52000, 51000, 51800],
    [1616715600000, 51800, 53000, 51500, 52500],
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders TokenTableError when there is an error", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: [],
      isLoading: false,
      error: new Error("Test error"),
    });

    // Act
    render(<TokenTableBody />);

    // Assert
    expect(screen.getByTestId("token-table-error")).toBeInTheDocument();
  });

  it("renders TokenTableLoading when loading", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: [],
      isLoading: true,
      error: null,
    });

    // Act
    render(<TokenTableBody />);

    // Assert
    expect(screen.getByTestId("token-table-loading")).toBeInTheDocument();
  });

  it("renders token rows when data is available", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: mockTokens,
      ethereumOHLC: mockOHLCData,
      averOHLC: mockOHLCData,
      isLoading: false,
      isOHLCLoading: false,
      error: null,
    });

    // Act
    render(<TokenTableBody />);

    // Assert
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getByText("Aver AI")).toBeInTheDocument();
    expect(screen.getByText("AVER")).toBeInTheDocument();
    expect(screen.getByText("$3,500")).toBeInTheDocument();
    expect(screen.getByText("$0.12")).toBeInTheDocument();

    // Check images
    const images = screen.getAllByTestId("token-image");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "/eth.png");
    expect(images[1]).toHaveAttribute("src", "/aver.png");

    // Check price changes are rendered
    const priceChanges = screen.getAllByTestId("price-change");
    expect(priceChanges.length).toBeGreaterThan(0);

    // Check OHLC sparklines are rendered
    const ohlcSparklines = screen.getAllByTestId("ohlc-sparkline");
    expect(ohlcSparklines).toHaveLength(2);
  });

  it("calls onRowClick when a row is clicked", () => {
    // Arrange
    const mockOnRowClick = jest.fn();
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: mockTokens,
      ethereumOHLC: mockOHLCData,
      averOHLC: mockOHLCData,
      isLoading: false,
      isOHLCLoading: false,
      error: null,
    });

    // Act
    render(<TokenTableBody onRowClick={mockOnRowClick} />);

    // Get the first row and click it
    const rows = screen.getAllByRole("row");
    fireEvent.click(rows[0]); // Click on Ethereum row

    // Assert
    expect(mockOnRowClick).toHaveBeenCalledWith("ethereum", "Ethereum");

    // Click on Aver AI row
    fireEvent.click(rows[1]);
    expect(mockOnRowClick).toHaveBeenCalledWith("aver-ai", "Aver AI");
  });

  it("doesn't break when onRowClick is not provided", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: mockTokens,
      ethereumOHLC: mockOHLCData,
      averOHLC: mockOHLCData,
      isLoading: false,
      isOHLCLoading: false,
      error: null,
    });

    // Act & Assert - should not throw
    expect(() => {
      const { container } = render(<TokenTableBody />);
      const rows = container.querySelectorAll("tr");
      fireEvent.click(rows[0]);
    }).not.toThrow();
  });
});
