import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

describe("Header Component", () => {
  it("renders correctly with title and emoji", () => {
    // Arrange & Act
    render(<Header />);

    // Assert
    expect(screen.getByText("My Portfolio")).toBeInTheDocument();
    expect(screen.getByText("⭐")).toBeInTheDocument();
    expect(screen.getByRole("heading")).toHaveClass(
      "flex",
      "items-center",
      "gap-3",
      "text-2xl",
      "font-semibold"
    );
  });
});
