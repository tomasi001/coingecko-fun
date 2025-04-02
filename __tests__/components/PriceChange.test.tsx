import { render, screen } from "@testing-library/react";
import PriceChange from "@/components/PriceChange";

describe("PriceChange Component", () => {
  it("renders positive values with up arrow and green color", () => {
    // Arrange & Act
    render(<PriceChange value={2.5} />);

    // Assert
    const priceElement = screen.getByText("▲ 2.5%");
    expect(priceElement).toBeInTheDocument();
    expect(priceElement).toHaveClass("text-green-500");
    expect(priceElement).not.toHaveClass("text-red-500");
  });

  it("renders negative values with down arrow and red color", () => {
    // Arrange & Act
    render(<PriceChange value={-1.8} />);

    // Assert
    const priceElement = screen.getByText("▼ 1.8%");
    expect(priceElement).toBeInTheDocument();
    expect(priceElement).toHaveClass("text-red-500");
    expect(priceElement).not.toHaveClass("text-green-500");
  });

  it("treats zero as a positive value", () => {
    // Arrange & Act
    render(<PriceChange value={0} />);

    // Assert
    const priceElement = screen.getByText("▲ 0.0%");
    expect(priceElement).toBeInTheDocument();
    expect(priceElement).toHaveClass("text-green-500");
    expect(priceElement).not.toHaveClass("text-red-500");
  });
});
