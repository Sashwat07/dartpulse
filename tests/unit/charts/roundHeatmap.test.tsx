import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { RoundHeatmap } from "@/components/analytics/RoundHeatmap";

describe("RoundHeatmap", () => {
  it("renders title and subtitle when given valid data", () => {
    const players = [{ playerId: "p1", playerName: "Alice" }];
    const rounds = [{ round: 1, scores: { p1: 45 } }];
    const { container } = render(<RoundHeatmap players={players} rounds={rounds} />);
    const scope = within(container);
    expect(scope.getByText("Round heatmap")).toBeInTheDocument();
    expect(
      scope.getByText(/Score per round. Color intensity by score/),
    ).toBeInTheDocument();
  });

  it("renders table structure for valid players and rounds", () => {
    const players = [
      { playerId: "p1", playerName: "Alice" },
      { playerId: "p2", playerName: "Bob" },
    ];
    const rounds = [
      { round: 1, scores: { p1: 20, p2: 18 } },
      { round: 2, scores: { p1: 25, p2: 22 } },
    ];
    const { container } = render(<RoundHeatmap players={players} rounds={rounds} />);
    const scope = within(container);
    const table = scope.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(scope.getByText("Player")).toBeInTheDocument();
    expect(scope.getByText("R1")).toBeInTheDocument();
    expect(scope.getByText("R2")).toBeInTheDocument();
    expect(scope.getByText("Alice")).toBeInTheDocument();
    expect(scope.getByText("Bob")).toBeInTheDocument();
  });

  it("handles empty rounds and shows empty-state message", () => {
    const { container } = render(<RoundHeatmap players={[]} rounds={[]} />);
    const scope = within(container);
    expect(scope.getByText("Round heatmap")).toBeInTheDocument();
    expect(scope.getByText("No data.")).toBeInTheDocument();
  });

  it("handles empty players and shows empty-state message", () => {
    const { container } = render(
      <RoundHeatmap players={[]} rounds={[{ round: 1, scores: {} }]} />,
    );
    const scope = within(container);
    expect(scope.getByText("No data.")).toBeInTheDocument();
  });

  it("does not crash with minimal heatmap input", () => {
    const players = [{ playerId: "p1", playerName: "Solo" }];
    const rounds = [{ round: 1, scores: { p1: 30 } }];
    expect(() => render(<RoundHeatmap players={players} rounds={rounds} />)).not.toThrow();
  });

  it("handles missing score for a player in a round (shows dash)", () => {
    const players = [{ playerId: "p1", playerName: "Alice" }];
    const rounds = [{ round: 1, scores: {} }];
    const { container } = render(<RoundHeatmap players={players} rounds={rounds} />);
    const scope = within(container);
    expect(scope.getByRole("table")).toBeInTheDocument();
    const cells = scope.getAllByRole("cell");
    const dashCell = cells.find((c) => c.textContent === "—");
    expect(dashCell).toBeDefined();
  });
});
