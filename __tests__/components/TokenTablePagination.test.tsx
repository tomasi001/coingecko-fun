import { render, screen, fireEvent } from "@testing-library/react";
import TokenTablePagination from "@/components/TokenTablePagination";
import { useTokenContext } from "@/context/token-context";
import { TokenData } from "@/types";

// Mock token context
jest.mock("@/context/token-context", () => ({
  useTokenContext: jest.fn(),
}));

// Mock UI components
jest.mock("@/components/ui/pagination", () => ({
  Pagination: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pagination">{children}</div>
  ),
  PaginationContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pagination-content">{children}</div>
  ),
  PaginationItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pagination-item">{children}</div>
  ),
  PaginationLink: ({
    children,
    onClick,
    isActive,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    isActive?: boolean;
  }) => (
    <button
      data-testid={`page-link-${children}`}
      onClick={onClick}
      className={isActive ? "active" : ""}
    >
      {children}
    </button>
  ),
  PaginationNext: ({
    onClick,
    className,
  }: {
    onClick: () => void;
    className: string;
  }) => (
    <button data-testid="next-button" onClick={onClick} className={className}>
      Next
    </button>
  ),
  PaginationPrevious: ({
    onClick,
    className,
  }: {
    onClick: () => void;
    className: string;
  }) => (
    <button data-testid="prev-button" onClick={onClick} className={className}>
      Previous
    </button>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange: (value: string) => void;
    value: string;
  }) => (
    <div
      data-testid="select"
      data-value={value}
      onClick={() => onValueChange("20")}
    >
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-testid={`select-item-${value}`}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: () => <div data-testid="select-value" />,
}));

describe("TokenTablePagination Component", () => {
  const mockSetCurrentPage = jest.fn();
  const mockSetItemsPerPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with pagination info", () => {
    // Arrange
    const mockTokens: TokenData[] = Array(25)
      .fill(null)
      .map((_, i) => ({
        id: `token-${i}`,
        name: `Token ${i}`,
        symbol: `TKN${i}`,
        image: `/token-${i}.png`,
        current_price: 100 + i,
        price_change_percentage_1h: 0.1 * i,
        price_change_percentage_24h: 0.2 * i,
        price_change_percentage_7d: 0.3 * i,
        total_volume: 1000000 * (i + 1),
        market_cap: 10000000 * (i + 1),
        sparkline_data: [100, 101, 102],
      }));

    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: mockTokens,
      currentPage: 1,
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);

    // Assert
    expect(screen.getByText("Showing 10 of 25 results")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-1")).toHaveClass("active");
    expect(screen.getByTestId("page-link-2")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-3")).toBeInTheDocument();
    expect(screen.getByTestId("prev-button")).toHaveClass(
      "pointer-events-none opacity-50"
    );
    expect(screen.getByTestId("next-button")).not.toHaveClass(
      "pointer-events-none opacity-50"
    );
  });

  it("changes page when clicking on page numbers", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: Array(50).fill(null),
      currentPage: 1,
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);
    fireEvent.click(screen.getByTestId("page-link-3"));

    // Assert
    expect(mockSetCurrentPage).toHaveBeenCalledWith(3);
  });

  it("changes items per page when selecting a different option", () => {
    // Arrange
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: Array(50).fill(null),
      currentPage: 1,
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);
    fireEvent.click(screen.getByTestId("select"));

    // Assert
    expect(mockSetItemsPerPage).toHaveBeenCalledWith(20);
  });
});
