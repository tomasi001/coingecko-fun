import { render, screen } from "@testing-library/react";
import OHLCSparkline from "@/components/OHLCSparkline";
import { OHLCData } from "@/types";

// Mock the Line component from react-chartjs-2
jest.mock("react-chartjs-2", () => ({
  Line: jest.fn().mockImplementation(() => <div data-testid="line-chart" />),
}));

// Mock the LoadingIndicator component
jest.mock("@/components", () => ({
  LoadingIndicator: jest
    .fn()
    .mockImplementation(() => <div data-testid="loading-indicator" />),
}));

describe("OHLCSparkline Component", () => {
  const mockOHLCData: OHLCData = [
    {
      timestamp: 1648656000000,
      open: 3000,
      high: 3200,
      low: 2900,
      close: 3100,
    },
    {
      timestamp: 1648742400000,
      open: 3100,
      high: 3300,
      low: 3050,
      close: 3250,
    },
  ];

  it("renders the LoadingIndicator when isLoading is true", () => {
    // Arrange & Act
    render(<OHLCSparkline data={mockOHLCData} isLoading={true} />);

    // Assert
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
  });

  it("renders the LoadingIndicator when data is undefined", () => {
    // Arrange & Act
    render(<OHLCSparkline data={undefined} isLoading={false} />);

    // Assert
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
  });

  it("renders the Line chart when data is provided and not loading", () => {
    // Arrange & Act
    render(<OHLCSparkline data={mockOHLCData} isLoading={false} />);

    // Assert
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
  });
});
