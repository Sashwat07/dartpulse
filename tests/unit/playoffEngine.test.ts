import { describe, expect, it, vi, beforeEach } from "vitest";
import type { PlayoffMatch } from "@/types/playoff";
import { makePlayoffMatch } from "@/tests/fixtures/playoffMatches";
import {
  fourPlayerPlayoffMatch,
  fourPlayerPlayoffPlayers,
  fourPlayerPlayoffRegularThrowEvents,
} from "@/tests/fixtures";

const repoMocks = vi.hoisted(() => ({
  createPlayoffMatch: vi.fn(),
  listPlayoffMatchesByParentMatch: vi.fn(),
  getMatchById: vi.fn(),
}));

vi.mock("@/lib/repositories", async () => {
  const actual = await vi.importActual<typeof import("@/lib/repositories")>("@/lib/repositories");
  return {
    ...actual,
    createPlayoffMatch: (...args: unknown[]) => repoMocks.createPlayoffMatch(...args),
    listPlayoffMatchesByParentMatch: (...args: unknown[]) =>
      repoMocks.listPlayoffMatchesByParentMatch(...args),
    getMatchById: (...args: unknown[]) => repoMocks.getMatchById(...args),
  };
});

import { bootstrapPlayoffs, deriveNextPlayoffMatchIfNeeded } from "@/lib/playoffEngine";

const PARENT = "match-parent";
const A = "p-a";
const B = "p-b";
const C = "p-c";
const D = "p-d";

function base(
  overrides: Partial<PlayoffMatch> &
    Pick<PlayoffMatch, "stage" | "player1Id" | "player2Id" | "status">,
): PlayoffMatch {
  return makePlayoffMatch({
    playoffMatchId: `pm-${overrides.stage}-${overrides.player1Id}`,
    parentMatchId: PARENT,
    decidedByPlayerId: overrides.player1Id,
    ...overrides,
  });
}

describe("bootstrapPlayoffs (4+ players, new format)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoMocks.listPlayoffMatchesByParentMatch.mockResolvedValue([]);
    repoMocks.getMatchById.mockResolvedValue(fourPlayerPlayoffMatch);
    repoMocks.createPlayoffMatch.mockImplementation(
      async (data: {
        parentMatchId: string;
        stage: PlayoffMatch["stage"];
        player1Id: string;
        player2Id: string;
        decidedByPlayerId?: string;
      }) =>
        makePlayoffMatch({
          playoffMatchId: `boot-${data.stage}`,
          parentMatchId: data.parentMatchId,
          stage: data.stage,
          player1Id: data.player1Id,
          player2Id: data.player2Id,
          status: "pending",
          decidedByPlayerId: data.decidedByPlayerId,
        }),
    );
  });

  it("creates only qualifier1 (1 vs 2) and eliminator (3 vs 4) from regular top-four order", async () => {
    const matchId = fourPlayerPlayoffMatch.matchId;
    await bootstrapPlayoffs(
      matchId,
      "matchFinished",
      fourPlayerPlayoffMatch.totalRounds,
      fourPlayerPlayoffRegularThrowEvents,
      fourPlayerPlayoffPlayers,
      fourPlayerPlayoffMatch.shotsPerRound ?? 1,
    );

    expect(repoMocks.createPlayoffMatch).toHaveBeenCalledTimes(2);

    const calls = repoMocks.createPlayoffMatch.mock.calls.map((c) => c[0]);
    const q1 = calls.find((c) => c.stage === "qualifier1");
    const elim = calls.find((c) => c.stage === "eliminator");

    expect(q1).toEqual(
      expect.objectContaining({
        parentMatchId: matchId,
        stage: "qualifier1",
        player1Id: fourPlayerPlayoffPlayers[0].playerId,
        player2Id: fourPlayerPlayoffPlayers[1].playerId,
        decidedByPlayerId: fourPlayerPlayoffPlayers[0].playerId,
      }),
    );
    expect(elim).toEqual(
      expect.objectContaining({
        parentMatchId: matchId,
        stage: "eliminator",
        player1Id: fourPlayerPlayoffPlayers[2].playerId,
        player2Id: fourPlayerPlayoffPlayers[3].playerId,
        decidedByPlayerId: fourPlayerPlayoffPlayers[2].playerId,
      }),
    );

    expect(calls.some((c) => c.stage === "qualifier2")).toBe(false);
    expect(calls.some((c) => c.stage === "final")).toBe(false);
  });

  it("returns existing playoff rows without calling create when list is non-empty", async () => {
    const existing = [
      makePlayoffMatch({
        playoffMatchId: "existing-q1",
        parentMatchId: fourPlayerPlayoffMatch.matchId,
        stage: "qualifier1",
        player1Id: A,
        player2Id: B,
        status: "pending",
      }),
    ];
    repoMocks.listPlayoffMatchesByParentMatch.mockResolvedValue(existing);

    const out = await bootstrapPlayoffs(
      fourPlayerPlayoffMatch.matchId,
      "matchFinished",
      1,
      fourPlayerPlayoffRegularThrowEvents,
      fourPlayerPlayoffPlayers,
      1,
    );

    expect(out).toBe(existing);
    expect(repoMocks.createPlayoffMatch).not.toHaveBeenCalled();
  });
});

describe("deriveNextPlayoffMatchIfNeeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoMocks.listPlayoffMatchesByParentMatch.mockResolvedValue([]);
    repoMocks.getMatchById.mockResolvedValue(null);
    repoMocks.createPlayoffMatch.mockImplementation(
      async (data: {
        parentMatchId: string;
        stage: PlayoffMatch["stage"];
        player1Id: string;
        player2Id: string;
        decidedByPlayerId?: string;
      }) =>
        makePlayoffMatch({
          playoffMatchId: `new-${data.stage}`,
          parentMatchId: data.parentMatchId,
          stage: data.stage,
          player1Id: data.player1Id,
          player2Id: data.player2Id,
          status: "pending",
          decidedByPlayerId: data.decidedByPlayerId,
        }),
    );
  });

  it("after Q1 + eliminator complete, creates qualifier2 (loser Q1 vs winner eliminator)", async () => {
    const q1 = base({
      stage: "qualifier1",
      player1Id: A,
      player2Id: B,
      status: "completed",
      winnerId: A,
      loserId: B,
      player1Score: 50,
      player2Score: 30,
    });
    const elim = base({
      stage: "eliminator",
      player1Id: C,
      player2Id: D,
      status: "completed",
      winnerId: C,
      loserId: D,
      player1Score: 40,
      player2Score: 20,
    });

    await deriveNextPlayoffMatchIfNeeded(PARENT, [q1, elim]);

    expect(repoMocks.createPlayoffMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        parentMatchId: PARENT,
        stage: "qualifier2",
        player1Id: B,
        player2Id: C,
      }),
    );
  });

  it("after qualifier2 completes, creates final (winner Q1 vs winner Q2)", async () => {
    const q1 = base({
      stage: "qualifier1",
      player1Id: A,
      player2Id: B,
      status: "completed",
      winnerId: A,
      loserId: B,
    });
    const elim = base({
      stage: "eliminator",
      player1Id: C,
      player2Id: D,
      status: "completed",
      winnerId: C,
      loserId: D,
    });
    const q2 = base({
      stage: "qualifier2",
      player1Id: B,
      player2Id: C,
      status: "completed",
      winnerId: B,
      loserId: C,
    });

    await deriveNextPlayoffMatchIfNeeded(PARENT, [q1, elim, q2]);

    expect(repoMocks.createPlayoffMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        parentMatchId: PARENT,
        stage: "final",
        player1Id: A,
        player2Id: B,
        decidedByPlayerId: A,
      }),
    );
  });

  it("returns null when Q1 done but eliminator still open", async () => {
    const q1 = base({
      stage: "qualifier1",
      player1Id: A,
      player2Id: B,
      status: "completed",
      winnerId: A,
      loserId: B,
    });
    const elim = base({
      stage: "eliminator",
      player1Id: C,
      player2Id: D,
      status: "active",
    });

    const next = await deriveNextPlayoffMatchIfNeeded(PARENT, [q1, elim]);
    expect(next).toBeNull();
    expect(repoMocks.createPlayoffMatch).not.toHaveBeenCalled();
  });

  it("does not create final when Q2 exists but is not completed", async () => {
    const q1 = base({
      stage: "qualifier1",
      player1Id: A,
      player2Id: B,
      status: "completed",
      winnerId: A,
      loserId: B,
    });
    const elim = base({
      stage: "eliminator",
      player1Id: C,
      player2Id: D,
      status: "completed",
      winnerId: C,
      loserId: D,
    });
    const q2 = base({
      stage: "qualifier2",
      player1Id: B,
      player2Id: C,
      status: "active",
    });

    repoMocks.createPlayoffMatch.mockClear();
    const next = await deriveNextPlayoffMatchIfNeeded(PARENT, [q1, elim, q2]);
    expect(next).toBeNull();
    expect(repoMocks.createPlayoffMatch).not.toHaveBeenCalled();
  });
});
