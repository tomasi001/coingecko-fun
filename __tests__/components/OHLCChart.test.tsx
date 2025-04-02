import { render, screen } from "@testing-library/react";
import OHLCChart from "@/components/OHLCChart";
import { useTokenContext } from "@/context/token-context";
import { OHLCData } from "@/types";

// Store original Date implementation
const OriginalDate = global.Date;

// Mock recharts components and collect props
const tooltipProps = {
  labelFormatter: null,
  formatter: null,
};

jest.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: ({ tickFormatter }: { tickFormatter: any }) => {
    // Don't call tickFormatter here, as it uses Date which we need to mock carefully
    return <div data-testid="x-axis" />;
  },
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: (props: any) => {
    // Store the formatter functions to test them later
    tooltipProps.formatter = props.formatter;
    tooltipProps.labelFormatter = props.labelFormatter;
    return <div data-testid="tooltip" />;
  },
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
    // Reset tooltip props
    tooltipProps.formatter = null;
    tooltipProps.labelFormatter = null;
  });

  afterEach(() => {
    // Restore original Date
    global.Date = OriginalDate;
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

  it("formats dates correctly for display", () => {
    // Arrange
    // Create a mock for the toLocaleDateString method
    const mockToLocaleDateString = jest.fn().mockReturnValue("03/30/2022");

    // Create a mock Date instance
    const mockDateInstance = {
      toLocaleDateString: mockToLocaleDateString,
    };

    // Create a mock Date constructor
    const MockDate = jest.fn(() => mockDateInstance) as any;
    MockDate.prototype = OriginalDate.prototype;

    // Replace global Date with mock
    global.Date = MockDate as DateConstructor;

    (useTokenContext as jest.Mock).mockReturnValue({
      ethereumOHLC: mockOHLCData,
      averOHLC: [],
      isOHLCLoading: false,
    });

    // Act
    render(<OHLCChart tokenId="ethereum" tokenName="Ethereum" />);

    // Assert - manually test the formatDate function
    // Extract formatDate from the component by accessing the tooltip props
    const formatDateFunc = tooltipProps.labelFormatter;

    if (formatDateFunc) {
      const result = formatDateFunc(1648656000000);
      // The mock should return the fixed string
      expect(result).toBe("03/30/2022");
      // Verify the Date constructor was called with timestamp
      expect(MockDate).toHaveBeenCalledWith(1648656000000);
      // Verify toLocaleDateString was called
      expect(mockToLocaleDateString).toHaveBeenCalled();
    } else {
      fail("labelFormatter not captured");
    }
  });

  it("uses tooltip formatter functions correctly", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      ethereumOHLC: mockOHLCData,
      averOHLC: [],
      isOHLCLoading: false,
    });

    // Act
    render(<OHLCChart tokenId="ethereum" tokenName="Ethereum" />);

    // Assert
    // Test that formatter functions were passed to Tooltip
    expect(tooltipProps.formatter).not.toBeNull();

    // Test the actual formatter behavior
    if (tooltipProps.formatter) {
      const formattedValue = tooltipProps.formatter("3000", "testKey", {});
      expect(formattedValue).toEqual(["$3000.00", ""]);
    } else {
      fail("formatter not captured");
    }
  });

  it("handles null or undefined chart data gracefully", () => {
    // Arrange - test with null data
    (useTokenContext as jest.Mock).mockReturnValue({
      ethereumOHLC: null,
      averOHLC: null,
      isOHLCLoading: false,
    });

    // Act
    render(<OHLCChart tokenId="ethereum" tokenName="Ethereum" />);

    // Assert
    expect(
      screen.getByText("No chart data available for Ethereum")
    ).toBeInTheDocument();
  });

  it("renders all four line components for OHLC data", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      ethereumOHLC: mockOHLCData,
      averOHLC: [],
      isOHLCLoading: false,
    });

    // Act
    render(<OHLCChart tokenId="ethereum" tokenName="Ethereum" />);

    // Assert
    const lines = screen.getAllByTestId("line");
    expect(lines).toHaveLength(4); // open, high, low, close
  });
});
