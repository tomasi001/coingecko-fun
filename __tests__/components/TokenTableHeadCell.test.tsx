import { render, screen } from "@testing-library/react";
import TokenTableHeadCell from "@/components/TokenTable/TokenTableHeadCell";

describe("TokenTableHeadCell Component", () => {
  it("renders with children content", () => {
    // Arrange & Act
    render(<TokenTableHeadCell>Test Cell</TokenTableHeadCell>);

    // Assert
    expect(screen.getByText("Test Cell")).toBeInTheDocument();
  });

  it("applies default className", () => {
    // Arrange & Act
    const { container } = render(
      <TokenTableHeadCell>Test Cell</TokenTableHeadCell>
    );

    // Assert
    const headCell = container.firstChild;
    expect(headCell).toHaveClass("h-10");
    expect(headCell).toHaveClass("text-muted-foreground");
    expect(headCell).toHaveClass("bg-[#151819]");
  });

  it("applies custom className when provided", () => {
    // Arrange & Act
    const { container } = render(
      <TokenTableHeadCell className="custom-class">
        Test Cell
      </TokenTableHeadCell>
    );

    // Assert
    const headCell = container.firstChild;
    expect(headCell).toHaveClass("custom-class");
  });
});
