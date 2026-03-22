import { describe, expect, it } from "vitest";
import {
  getDownstreamForBlocking,
  getDownstreamForReconcile,
} from "@/lib/playoffUndo";
import { fourPlayerPlayoffScenario, PLAYOFF_IDS } from "@/tests/fixtures";

describe("getDownstreamForBlocking", () => {
  const allMatches = fourPlayerPlayoffScenario.playoffMatches;

  it("returns Eliminator for qualifier1 (parallel opening round)", () => {
    const downstream = getDownstreamForBlocking(allMatches, PLAYOFF_IDS.qualifier1);
    expect(downstream).toHaveLength(1);
    expect(downstream[0].stage).toBe("eliminator");
  });

  it("returns Qualifier2 for eliminator", () => {
    const downstream = getDownstreamForBlocking(allMatches, PLAYOFF_IDS.eliminator);
    expect(downstream).toHaveLength(1);
    expect(downstream[0].stage).toBe("qualifier2");
  });

  it("returns Final for qualifier2", () => {
    const downstream = getDownstreamForBlocking(allMatches, PLAYOFF_IDS.qualifier2);
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

  it("returns Qualifier2 and Final for qualifier1", () => {
    const downstream = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.qualifier1);
    expect(downstream).toHaveLength(2);
    const stages = downstream.map((m) => m.stage);
    expect(stages).toEqual(["qualifier2", "final"]);
  });

  it("returns Qualifier2 and Final for eliminator", () => {
    const downstream = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.eliminator);
    expect(downstream).toHaveLength(2);
    const stages = downstream.map((m) => m.stage);
    expect(stages).toEqual(["qualifier2", "final"]);
  });

  it("returns Final for qualifier2", () => {
    const downstream = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.qualifier2);
    expect(downstream).toHaveLength(1);
    expect(downstream[0].stage).toBe("final");
  });

  it("returns empty for final", () => {
    const downstream = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.final);
    expect(downstream).toHaveLength(0);
  });

  it("documents new-format dependency: Q1 and eliminator both reconcile through Q2 then Final", () => {
    const q1Chain = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.qualifier1).map((m) => m.stage);
    const elimChain = getDownstreamForReconcile(allMatches, PLAYOFF_IDS.eliminator).map((m) => m.stage);
    expect(q1Chain).toEqual(["qualifier2", "final"]);
    expect(elimChain).toEqual(["qualifier2", "final"]);
  });
});
