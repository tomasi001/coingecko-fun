import { render } from "@testing-library/react";
import LoadingIndicator from "@/components/LoadingIndicator";

// Mock styled-components correctly
jest.mock("styled-components", () => {
  return {
    __esModule: true,
    default: {
      div: () => {
        return function StyledComponent(props: any) {
          return <div data-testid="styled-wrapper" {...props} />;
        };
      },
    },
  };
});

describe("LoadingIndicator Component", () => {
  it("renders correctly with spinner and spans", () => {
    // Arrange & Act
    const { container, getByTestId } = render(<LoadingIndicator />);

    // Assert
    expect(getByTestId("styled-wrapper")).toBeInTheDocument();

    // Check if the spinner container exists
    const spinner = container.querySelector(".spinner");
    expect(spinner).toBeInTheDocument();

    // Check if all 8 spans are rendered
    const spans = container.querySelectorAll(".spinner span");
    expect(spans).toHaveLength(8);
  });
});
