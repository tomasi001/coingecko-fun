import { render, screen } from "@testing-library/react";
import OHLCChart from "@/components/OHLCChart";
import { useTokenContext } from "@/context/token-context";
import { OHLCData } from "@/types";

// Mock recharts components
jest.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock token context
jest.mock("@/context/token-context", () => ({
  useTokenContext: jest.fn(),
}));

describe("OHLCChart Component", () => {
  const mockOHLCData: OHLCData = [
    {
      timestamp: 1648656000000, // March 30, 2022
      open: 3000,
      high: 3200,
      low: 2900,
      close: 3100,
    },
    {
      timestamp: 1648742400000, // March 31, 2022
      open: 3100,
      high: 3300,
      low: 3050,
      close: 3250,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state when isOHLCLoading is true", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      ethereumOHLC: [],
      averOHLC: [],
      isOHLCLoading: true,
    });

    // Act
    render(<OHLCChart tokenId="ethereum" tokenName="Ethereum" />);

    // Assert
    expect(screen.getByText("Loading chart data...")).toBeInTheDocument();
  });

  it("renders no data message when chart data is empty", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      ethereumOHLC: [],
      averOHLC: [],
      isOHLCLoading: false,
    });

    // Act
    render(<OHLCChart tokenId="ethereum" tokenName="Ethereum" />);

    // Assert
    expect(
      screen.getByText("No chart data available for Ethereum")
    ).toBeInTheDocument();
  });

  it("renders ethereum chart when tokenId is ethereum", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      ethereumOHLC: mockOHLCData,
      averOHLC: [],
      isOHLCLoading: false,
    });

    // Act
    render(<OHLCChart tokenId="ethereum" tokenName="Ethereum" />);

    // Assert
    expect(screen.getByText("Ethereum - 7 Day OHLC Chart")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders aver chart when tokenId is aver-ai", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      ethereumOHLC: [],
      averOHLC: mockOHLCData,
      isOHLCLoading: false,
    });

    // Act
    render(<OHLCChart tokenId="aver-ai" tokenName="Aver AI" />);

    // Assert
    expect(screen.getByText("Aver AI - 7 Day OHLC Chart")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});
