import { describe, expect, it } from "vitest";
import { render, within } from "@testing-library/react";
import { PlayerVolumeChart } from "@/components/charts/PlayerVolumeChart";
import { PlayerScoringChart } from "@/components/charts/PlayerScoringChart";
import type { PlayerAnalytics } from "@/lib/analytics/types";

function minimalStats(overrides: Partial<PlayerAnalytics> = {}): PlayerAnalytics {
  return {
    playerId: "p1",
    playerName: "Alice",
    matchesPlayed: 2,
    roundsPlayed: 10,
    wins: 1,
    totalPoints: 400,
    bestThrow: 60,
    averageRoundScore: 40,
    totalThrows: 10,
    ...overrides,
  };
}

describe("PlayerVolumeChart", () => {
  it("renders without crashing when given valid stats", () => {
    const stats = minimalStats();
    expect(() => render(<PlayerVolumeChart stats={stats} />)).not.toThrow();
  });

  it("shows chart card title and description when stats are valid", () => {
    const { container } = render(<PlayerVolumeChart stats={minimalStats()} />);
    const scope = within(container);
    expect(scope.getByText("Matches & wins")).toBeInTheDocument();
    expect(scope.getByText(/Completed matches played and wins/)).toBeInTheDocument();
  });

  it("renders empty-state message when stats is null", () => {
    const { container } = render(<PlayerVolumeChart stats={null} />);
    const scope = within(container);
    expect(scope.getByText("Matches & wins")).toBeInTheDocument();
    expect(scope.getByText(/Not enough player data yet/)).toBeInTheDocument();
  });

  it("renders empty-state when matchesPlayed is 0", () => {
    const { container } = render(
      <PlayerVolumeChart stats={minimalStats({ matchesPlayed: 0 })} />,
    );
    const scope = within(container);
    expect(scope.getByText("Matches & wins")).toBeInTheDocument();
    expect(scope.getByText(/Not enough player data yet/)).toBeInTheDocument();
  });
});

describe("PlayerScoringChart", () => {
  it("renders without crashing when given valid stats", () => {
    const stats = minimalStats();
    expect(() => render(<PlayerScoringChart stats={stats} />)).not.toThrow();
  });

  it("shows chart card title and description when stats are valid", () => {
    const { container } = render(<PlayerScoringChart stats={minimalStats()} />);
    const scope = within(container);
    expect(scope.getByText("Scoring")).toBeInTheDocument();
    expect(
      scope.getByText(/Average score per round and best single throw/),
    ).toBeInTheDocument();
  });

  it("renders empty-state message when stats is null", () => {
    const { container } = render(<PlayerScoringChart stats={null} />);
    const scope = within(container);
    expect(scope.getByText("Scoring")).toBeInTheDocument();
    expect(scope.getByText(/Not enough player data yet/)).toBeInTheDocument();
  });

  it("renders empty-state when roundsPlayed is 0", () => {
    const { container } = render(
      <PlayerScoringChart stats={minimalStats({ roundsPlayed: 0 })} />,
    );
    const scope = within(container);
    expect(scope.getByText("Scoring")).toBeInTheDocument();
    expect(scope.getByText(/Not enough player data yet/)).toBeInTheDocument();
  });
});
