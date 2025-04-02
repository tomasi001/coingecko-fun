import { render, screen } from "@testing-library/react";
import TokenTableLoading from "@/components/TokenTable/TokenTableLoading";

// Mock the LoadingIndicator component
jest.mock("@/components", () => ({
  LoadingIndicator: () => <div data-testid="loading-indicator" />,
}));

describe("TokenTableLoading Component", () => {
  it("renders with LoadingIndicator", () => {
    // Arrange & Act
    render(<TokenTableLoading />);

    // Assert
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });

  it("renders inside a TableCell with correct attributes", () => {
    // Arrange & Act
    const { container } = render(<TokenTableLoading />);

    // Assert
    const tableCell = container.querySelector("td");
    expect(tableCell).toHaveAttribute("colspan", "8");
    expect(tableCell).toHaveClass("flex");
    expect(tableCell).toHaveClass("h-36");
    expect(tableCell).toHaveClass("w-full");
    expect(tableCell).toHaveClass("items-center");
    expect(tableCell).toHaveClass("justify-center");
    expect(tableCell).toHaveClass("animate-pulse");
  });
});
