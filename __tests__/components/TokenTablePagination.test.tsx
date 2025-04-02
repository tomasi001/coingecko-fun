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

  // New tests to increase coverage

  it("displays correct pagination for few pages (≤ 5 pages)", () => {
    // Arrange - 3 pages total (30 items with 10 per page)
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: Array(30).fill(null),
      currentPage: 2,
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);

    // Assert - should show exactly 3 pages
    expect(screen.getByTestId("page-link-1")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-2")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-3")).toBeInTheDocument();
    expect(screen.queryByTestId("page-link-4")).not.toBeInTheDocument();
  });

  it("displays correct pagination for early pages (currentPage ≤ 3)", () => {
    // Arrange - many pages but current page is 2
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: Array(100).fill(null),
      currentPage: 2,
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);

    // Assert - should show pages 1-5
    expect(screen.getByTestId("page-link-1")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-2")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-3")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-4")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-5")).toBeInTheDocument();
    expect(screen.queryByTestId("page-link-6")).not.toBeInTheDocument();
  });

  it("displays correct pagination for late pages (near the end)", () => {
    // Arrange - 10 pages total and current page is 9 (near end)
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: Array(100).fill(null),
      currentPage: 9,
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);

    // Assert - should show pages 6-10
    expect(screen.queryByTestId("page-link-5")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-link-6")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-7")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-8")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-9")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-10")).toBeInTheDocument();
  });

  it("displays correct pagination for middle pages", () => {
    // Arrange - many pages with current page in middle
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: Array(100).fill(null),
      currentPage: 6,
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);

    // Assert - should show 2 pages before and after current page
    expect(screen.getByTestId("page-link-4")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-5")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-6")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-7")).toBeInTheDocument();
    expect(screen.getByTestId("page-link-8")).toBeInTheDocument();
    expect(screen.queryByTestId("page-link-3")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-link-9")).not.toBeInTheDocument();
  });

  it("handles navigation to previous page", () => {
    // Arrange - current page is 3
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: Array(50).fill(null),
      currentPage: 3,
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);
    fireEvent.click(screen.getByTestId("prev-button"));

    // Assert
    expect(mockSetCurrentPage).toHaveBeenCalledWith(2);
  });

  it("handles navigation to next page", () => {
    // Arrange - current page is 3, not the last page
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: Array(50).fill(null),
      currentPage: 3,
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);
    fireEvent.click(screen.getByTestId("next-button"));

    // Assert
    expect(mockSetCurrentPage).toHaveBeenCalledWith(4);
  });

  it("disables next button on last page", () => {
    // Arrange - current page is the last page (5)
    (useTokenContext as jest.Mock).mockReturnValue({
      tokens: Array(50).fill(null),
      currentPage: 5, // Last page (50 items / 10 per page)
      setCurrentPage: mockSetCurrentPage,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage,
    });

    // Act
    render(<TokenTablePagination />);

    // Assert
    expect(screen.getByTestId("next-button")).toHaveClass(
      "pointer-events-none opacity-50"
    );

    // Try clicking the disabled button
    fireEvent.click(screen.getByTestId("next-button"));
    expect(mockSetCurrentPage).not.toHaveBeenCalled();
  });
});
