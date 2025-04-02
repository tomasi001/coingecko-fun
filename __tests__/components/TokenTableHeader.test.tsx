import { render, screen } from "@testing-library/react";
import TokenTableHeader from "@/components/TokenTable/TokenTableHeader";
import { useTokenContext } from "@/context/token-context";
import { tableHeaders } from "@/constants";

// Mock the token context
jest.mock("@/context/token-context", () => ({
  useTokenContext: jest.fn(),
}));

describe("TokenTableHeader Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all headers when not loading and no error", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      isLoading: false,
      error: null,
    });

    // Act
    render(<TokenTableHeader />);

    // Assert
    tableHeaders.forEach((header) => {
      expect(screen.getByText(header.name)).toBeInTheDocument();
    });
  });

  it("renders only first header when loading", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      isLoading: true,
      error: null,
    });

    // Act
    render(<TokenTableHeader />);

    // Assert
    expect(screen.getByText(tableHeaders[0].name)).toBeInTheDocument();

    // Check that other headers are not rendered
    tableHeaders.slice(1).forEach((header) => {
      expect(screen.queryByText(header.name)).not.toBeInTheDocument();
    });
  });

  it("renders only first header when there is an error", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      isLoading: false,
      error: new Error("Test error"),
    });

    // Act
    render(<TokenTableHeader />);

    // Assert
    expect(screen.getByText(tableHeaders[0].name)).toBeInTheDocument();

    // Check that other headers are not rendered
    tableHeaders.slice(1).forEach((header) => {
      expect(screen.queryByText(header.name)).not.toBeInTheDocument();
    });
  });
});
