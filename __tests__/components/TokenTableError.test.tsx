import { render, screen } from "@testing-library/react";
import TokenTableError from "@/components/TokenTable/TokenTableError";
import { useTokenContext } from "@/context/token-context";

// Mock the token context
jest.mock("@/context/token-context", () => ({
  useTokenContext: jest.fn(),
}));

describe("TokenTableError Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with specific error message when error has message", () => {
    // Arrange
    const errorMessage = "Failed to fetch token data";
    (useTokenContext as jest.Mock).mockReturnValue({
      error: new Error(errorMessage),
    });

    // Act
    render(<TokenTableError />);

    // Assert
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
  });

  it("renders with default error message when error has no message", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      error: new Error(),
    });

    // Act
    render(<TokenTableError />);

    // Assert
    expect(
      screen.getByText("Error: An error has occurred, please try again later")
    ).toBeInTheDocument();
  });

  it("renders with default error message when error is null", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      error: null,
    });

    // Act
    render(<TokenTableError />);

    // Assert
    expect(
      screen.getByText("Error: An error has occurred, please try again later")
    ).toBeInTheDocument();
  });

  it("renders inside a TableCell with correct attributes", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      error: new Error(),
    });

    // Act
    const { container } = render(<TokenTableError />);

    // Assert
    const tableCell = container.querySelector("td");
    expect(tableCell).toHaveAttribute("colspan", "8");
    expect(tableCell).toHaveClass("h-36");
    expect(tableCell).toHaveClass("text-center");
    expect(tableCell).toHaveClass("bg-gray-800");
  });
});
