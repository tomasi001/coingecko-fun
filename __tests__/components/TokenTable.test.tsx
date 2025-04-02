import { render, screen, fireEvent } from "@testing-library/react";
import TokenTable from "@/components/TokenTable";
import { useTokenContext } from "@/context/token-context";
import { TokenData } from "@/types";

// Mock the token context
jest.mock("@/context/token-context", () => ({
  useTokenContext: jest.fn(),
}));

// Mock the child components used in TokenTable
jest.mock("@/components/TokenTable/TokenTableHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="token-table-header" />,
}));

jest.mock("@/components/TokenTable/TokenTableBody", () => ({
  __esModule: true,
  default: ({
    onRowClick,
  }: {
    onRowClick: (id: string, name: string) => void;
  }) => (
    <div
      data-testid="token-table-body"
      onClick={() => onRowClick && onRowClick("ethereum", "Ethereum")}
    />
  ),
}));

describe("TokenTable Component", () => {
  const mockOnTokenSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with header and body", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
    });

    // Act
    render(<TokenTable onTokenSelect={mockOnTokenSelect} />);

    // Assert
    expect(screen.getByTestId("token-table-header")).toBeInTheDocument();
    expect(screen.getByTestId("token-table-body")).toBeInTheDocument();
  });

  it("renders with correct container classes", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
    });

    // Act
    const { container } = render(
      <TokenTable onTokenSelect={mockOnTokenSelect} />
    );

    // Assert
    const tableContainer = container.firstChild;
    expect(tableContainer).toHaveClass("rounded-lg");
    expect(tableContainer).toHaveClass("border-2");
    expect(tableContainer).toHaveClass("border-[#151819]");
    expect(tableContainer).toHaveClass("overflow-hidden");
  });

  it("calls onTokenSelect when a row is clicked", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: [],
      isLoading: false,
      error: null,
    });

    // Act
    render(<TokenTable onTokenSelect={mockOnTokenSelect} />);

    // Simulate a row click from the mocked TokenTableBody
    fireEvent.click(screen.getByTestId("token-table-body"));

    // Assert
    expect(mockOnTokenSelect).toHaveBeenCalledWith("ethereum", "Ethereum");
  });
});
