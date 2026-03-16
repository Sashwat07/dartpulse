import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { ChartContainer } from "@/components/charts/ChartContainer";

describe("ChartContainer", () => {
  it("renders title when provided", () => {
    const { container } = render(
      <ChartContainer title="Test chart title">
        <div data-testid="chart-child">Chart content</div>
      </ChartContainer>,
    );
    expect(within(container).getByText("Test chart title")).toBeInTheDocument();
  });

  it("renders optional description when provided", () => {
    const { container } = render(
      <ChartContainer title="Title" description="Short description text.">
        <div>Content</div>
      </ChartContainer>,
    );
    expect(within(container).getByText("Short description text.")).toBeInTheDocument();
  });

  it("does not render title when title is undefined", () => {
    const { container } = render(
      <ChartContainer description="Only description">
        <div>Content</div>
      </ChartContainer>,
    );
    expect(within(container).queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(within(container).getByText("Only description")).toBeInTheDocument();
  });

  it("renders with child without crashing and shows title", () => {
    const { container } = render(
      <ChartContainer title="Title">
        <div>Chart content</div>
      </ChartContainer>,
    );
    expect(within(container).getByText("Title")).toBeInTheDocument();
  });

  it("does not crash with minimal content", () => {
    expect(() =>
      render(
        <ChartContainer>
          <span />
        </ChartContainer>,
      ),
    ).not.toThrow();
  });
});
