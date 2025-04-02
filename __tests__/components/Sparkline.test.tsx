import { render, screen } from "@testing-library/react";
import Sparkline from "@/components/Sparkline";

// Mock Chart.js and react-chartjs-2
jest.mock("react-chartjs-2", () => ({
  Line: jest
    .fn()
    .mockImplementation(() => <div data-testid="sparkline-chart" />),
}));

// Mock Chart.js
jest.mock("chart.js", () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

describe("Sparkline Component", () => {
  it("renders the Line chart with provided data", () => {
    // Arrange
    const mockData = [3100, 3150, 3200, 3250, 3300];

    // Act
    render(<Sparkline data={mockData} />);

    // Assert
    expect(screen.getByTestId("sparkline-chart")).toBeInTheDocument();
  });

  it("renders in a container with correct dimensions", () => {
    // Arrange
    const mockData = [3100, 3150, 3200, 3250, 3300];

    // Act
    const { container } = render(<Sparkline data={mockData} />);

    // Assert
    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv).toHaveClass("w-32", "h-[64px]");
  });
});
