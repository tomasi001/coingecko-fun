import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

// Mock the Providers component
jest.mock("@/providers", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers-wrapper">{children}</div>
  ),
}));

// Mock the next/font/google imports
jest.mock("next/font/google", () => ({
  Inter: () => ({
    className: "mock-inter-class",
  }),
  Instrument_Sans: () => ({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-instrument-sans",
  }),
}));

describe("RootLayout", () => {
  it("renders layout with correct structure", () => {
    // Arrange
    const mockChildren = <div data-testid="mock-children">Test Content</div>;

    // Act
    render(<RootLayout children={mockChildren} />);

    // Assert
    // Check that HTML has the right lang attribute
    const htmlElement = document.documentElement;
    expect(htmlElement).toHaveAttribute("lang", "en");

    // Check that Providers are being used
    const providersWrapper = screen.getByTestId("providers-wrapper");
    expect(providersWrapper).toBeInTheDocument();

    // Check that the children are rendered
    const children = screen.getByTestId("mock-children");
    expect(children).toBeInTheDocument();
    expect(children.textContent).toBe("Test Content");
  });

  it("wraps children with Providers component", () => {
    // Arrange
    const mockChildren = <div data-testid="mock-children">Content</div>;

    // Act
    render(<RootLayout children={mockChildren} />);

    // Assert
    const providersWrapper = screen.getByTestId("providers-wrapper");
    expect(providersWrapper).toBeInTheDocument();

    // Check that the content is rendered inside providers
    const children = screen.getByTestId("mock-children");
    expect(children).toBeInTheDocument();
    expect(providersWrapper).toContainElement(children);
  });
});
