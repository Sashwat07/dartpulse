import { describe, expect, it } from "vitest";
import {
  getDownstreamForBlocking,
  getDownstreamForReconcile,
} from "@/lib/playoffUndo";
import { fourPlayerPlayoffScenario, PLAYOFF_IDS } from "@/tests/fixtures";

describe("getDownstreamForBlocking", () => {
  const allMatches = fourPlayerPlayoffScenario.playoffMatches;

  it("returns Q2 for qualifier1 (only immediate downstream)", () => {
    const downstream = getDownstreamForBlocking(allMatches, PLAYOFF_IDS.qualifier1);
    expect(downstream).toHaveLength(1);
    expect(downstream[0].stage).toBe("qualifier2");
  });

  it("returns Eliminator and Final for qualifier2", () => {
    const downstream = getDownstreamForBlocking(allMatches, PLAYOFF_IDS.qualifier2);
    expect(downstream).toHaveLength(2);
    const stages = downstream.map((m) => m.stage).sort();
    expect(stages).toEqual(["eliminator", "final"]);
  });

  it("returns Final for eliminator", () => {
    const downstream = getDownstreamForBlocking(allMatches, PLAYOFF_IDS.eliminator);
    expect(downstream).toHaveLength(1);
    expect(downstream[0].stage).toBe("final");
  });

  it("returns empty for final (no downstream)", () => {
    const downstream = getDownstreamForBlocking(allMatches, PLAYOFF_IDS.final);
    expect(downstream).toHaveLength(0);
  });
});

describe("getDownstreamForReconcile", () => {
  const allMatches = fourPlayerPlayoffScenario.playoffMatches;

  it("returns Eliminator and Final for qualifier1 (full derived chain)", () => {
    const downstream = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.qualifier1);
    expect(downstream).toHaveLength(2);
    const stages = downstream.map((m) => m.stage).sort();
    expect(stages).toEqual(["eliminator", "final"]);
  });

  it("returns Eliminator and Final for qualifier2", () => {
    const downstream = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.qualifier2);
    expect(downstream).toHaveLength(2);
    const stages = downstream.map((m) => m.stage).sort();
    expect(stages).toEqual(["eliminator", "final"]);
  });

  it("returns Final for eliminator", () => {
    const downstream = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.eliminator);
    expect(downstream).toHaveLength(1);
    expect(downstream[0].stage).toBe("final");
  });

  it("returns empty for final", () => {
    const downstream = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.final);
    expect(downstream).toHaveLength(0);
  });
});
