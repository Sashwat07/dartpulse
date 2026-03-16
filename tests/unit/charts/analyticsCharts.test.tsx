import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { WinsAndTotalPointsChart } from "@/components/charts/WinsAndTotalPointsChart";
import { AverageRoundScoreChart } from "@/components/charts/AverageRoundScoreChart";
import type { PlayerAnalytics } from "@/lib/analytics/types";

/** Minimal valid PlayerAnalytics for chart smoke tests. */
function minimalPlayer(overrides: Partial<PlayerAnalytics> = {}): PlayerAnalytics {
  return {
    playerId: "p1",
    playerName: "Alice",
    matchesPlayed: 1,
    roundsPlayed: 5,
    wins: 0,
    totalPoints: 200,
    bestThrow: 60,
    averageRoundScore: 40,
    totalThrows: 5,
    ...overrides,
  };
}

describe("WinsAndTotalPointsChart", () => {
  it("renders without crashing when given valid player data", () => {
    const players = [minimalPlayer()];
    expect(() => render(<WinsAndTotalPointsChart players={players} />)).not.toThrow();
  });

  it("shows chart card title and description when players are provided", () => {
    const players = [minimalPlayer({ playerName: "Bob" })];
    const { container } = render(<WinsAndTotalPointsChart players={players} />);
    const scope = within(container);
    expect(scope.getByText("Wins & total points")).toBeInTheDocument();
    expect(
      scope.getByText(/Wins \(left\) and total points \(right\) by player/),
    ).toBeInTheDocument();
  });

  it("renders empty-state message when players array is empty", () => {
    const { container } = render(<WinsAndTotalPointsChart players={[]} />);
    const scope = within(container);
    expect(scope.getByText("Wins & total points")).toBeInTheDocument();
    expect(scope.getByText(/Not enough analytics data yet/)).toBeInTheDocument();
  });

  it("does not throw on low-data input (one player)", () => {
    const players = [minimalPlayer({ playerName: "Solo" })];
    const { container } = render(<WinsAndTotalPointsChart players={players} />);
    expect(within(container).getByText("Wins & total points")).toBeInTheDocument();
  });
});

describe("AverageRoundScoreChart", () => {
  it("renders without crashing when given valid player data", () => {
    const players = [minimalPlayer()];
    expect(() => render(<AverageRoundScoreChart players={players} />)).not.toThrow();
  });

  it("shows chart card title and description when players are provided", () => {
    const players = [minimalPlayer()];
    const { container } = render(<AverageRoundScoreChart players={players} />);
    const scope = within(container);
    expect(scope.getByText("Average score per round")).toBeInTheDocument();
    expect(
      scope.getByText(/Per-player average.*Top 10 by total points/),
    ).toBeInTheDocument();
  });

  it("renders empty-state message when players array is empty", () => {
    const { container } = render(<AverageRoundScoreChart players={[]} />);
    const scope = within(container);
    expect(scope.getByText("Average score per round")).toBeInTheDocument();
    expect(scope.getByText(/Not enough analytics data yet/)).toBeInTheDocument();
  });

  it("does not throw on low-data input (one player)", () => {
    const players = [minimalPlayer()];
    const { container } = render(<AverageRoundScoreChart players={players} />);
    expect(within(container).getByText("Average score per round")).toBeInTheDocument();
  });
});
