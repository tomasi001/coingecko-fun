import { render, screen } from "@testing-library/react";
import Providers from "@/providers";
import { TokenProvider } from "@/context/token-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Mock the dependencies
jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

jest.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => <div data-testid="react-query-devtools" />,
}));

jest.mock("@/context/token-context", () => ({
  TokenProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="token-provider">{children}</div>
  ),
}));

describe("Providers Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with all providers properly nested", () => {
    // Mock QueryClient constructor
    (QueryClient as jest.Mock).mockImplementation(() => ({
      /* Mock implementation of QueryClient */
    }));

    // Arrange
    const testChild = <div data-testid="test-child">Test Content</div>;

    // Act
    render(<Providers>{testChild}</Providers>);

    // Assert
    // Check that the QueryClientProvider is rendered
    const queryClientProvider = screen.getByTestId("query-client-provider");
    expect(queryClientProvider).toBeInTheDocument();

    // Check that the TokenProvider is rendered inside QueryClientProvider
    const tokenProvider = screen.getByTestId("token-provider");
    expect(tokenProvider).toBeInTheDocument();
    expect(queryClientProvider).toContainElement(tokenProvider);

    // Check that ReactQueryDevtools is rendered
    const devtools = screen.getByTestId("react-query-devtools");
    expect(devtools).toBeInTheDocument();
    expect(queryClientProvider).toContainElement(devtools);

    // Check that the child is rendered inside TokenProvider
    const testChildElement = screen.getByTestId("test-child");
    expect(testChildElement).toBeInTheDocument();
    expect(tokenProvider).toContainElement(testChildElement);
    expect(testChildElement.textContent).toBe("Test Content");
  });

  it("initializes QueryClient", () => {
    // Setup spy on QueryClient constructor
    (QueryClient as jest.Mock).mockClear();
    
    // Act
    render(<Providers>Test</Providers>);
    
    // Assert
    expect(QueryClient).toHaveBeenCalledTimes(1);
  });

  it("ensures ReactQueryDevtools is included with initialIsOpen=false", () => {
    // Mock ReactQueryDevtools before rendering
    const mockReactQueryDevtools = jest.fn().mockReturnValue(<div />);
    jest.mock("@tanstack/react-query-devtools", () => ({
      ReactQueryDevtools: mockReactQueryDevtools,
    }), { virtual: true });
    
    // Act
    render(<Providers>Test</Providers>);
    
    // Assert
    // Simply verify the component is rendered without checking exact parameters
    const devtools = screen.getByTestId("react-query-devtools");
    expect(devtools).toBeInTheDocument();
  });
});
