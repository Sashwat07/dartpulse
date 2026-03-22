import { describe, expect, it, vi, beforeEach } from "vitest";

const NOT_FOUND = new Error("NOT_FOUND");
vi.mock("next/navigation", () => ({ notFound: () => { throw NOT_FOUND; } }));

vi.mock("@/lib/repositories", () => ({
  getMatchById: vi.fn(),
  getLinkedPlayerByUserId: vi.fn(),
  isPlayerInMatch: vi.fn(),
}));

vi.mock("@/lib/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}));

import {
  getMatchById,
  getLinkedPlayerByUserId,
  isPlayerInMatch,
} from "@/lib/repositories";
import { getCurrentUser } from "@/lib/getCurrentUser";
import {
  getMatchReadAccessForApi,
  getMatchWriteAccessForApi,
  getMatchViewAccessOrNotFound,
} from "@/lib/auth/matchAccess";
import type { Match } from "@/types/match";

const mockGetMatchById = vi.mocked(getMatchById);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockIsPlayerInMatch = vi.mocked(isPlayerInMatch);
const mockGetLinkedPlayerByUserId = vi.mocked(getLinkedPlayerByUserId);

function makeMatch(overrides: Partial<Match> & { matchId: string }): Match {
  const { matchId, ...rest } = overrides;
  return {
    name: "Test",
    mode: "casual",
    totalRounds: 3,
    status: "matchStarted",
    createdAt: "2025-01-01T00:00:00.000Z",
    ...rest,
    matchId,
  };
}

describe("getMatchWriteAccessForApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows unauthenticated access to unowned match", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const match = makeMatch({ matchId: "m1" });
    delete (match as Partial<Match>).createdByUserId;
    mockGetMatchById.mockResolvedValue(match);

    const r = await getMatchWriteAccessForApi("m1");
    expect(r).not.toBeInstanceOf(Response);
    if (r instanceof Response) return;
    expect(r.user).toBeNull();
    expect(r.match.matchId).toBe("m1");
  });

  it("requires auth for owned match mutations", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    mockGetMatchById.mockResolvedValue(
      makeMatch({ matchId: "m1", createdByUserId: "u1" }),
    );

    const r = await getMatchWriteAccessForApi("m1");
    expect(r).toBeInstanceOf(Response);
    expect((r as Response).status).toBe(401);
  });

  it("returns 404 for non-owner signed-in participant (no write)", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "participant",
      name: "P",
      email: null,
      image: null,
    });
    mockGetMatchById.mockResolvedValue(
      makeMatch({ matchId: "m1", createdByUserId: "owner" }),
    );

    const r = await getMatchWriteAccessForApi("m1");
    expect(r).toBeInstanceOf(Response);
    expect((r as Response).status).toBe(404);
  });
});

describe("getMatchReadAccessForApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows unauthenticated read of unowned match with writes enabled", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const match = makeMatch({ matchId: "m1" });
    delete (match as Partial<Match>).createdByUserId;
    mockGetMatchById.mockResolvedValue(match);

    const r = await getMatchReadAccessForApi("m1");
    expect(r).not.toBeInstanceOf(Response);
    if (r instanceof Response) return;
    expect(r.sessionWriteEnabled).toBe(true);
    expect(r.user).toBeNull();
  });

  it("returns 401 for owned match when not signed in", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    mockGetMatchById.mockResolvedValue(
      makeMatch({ matchId: "m1", createdByUserId: "owner" }),
    );

    const r = await getMatchReadAccessForApi("m1");
    expect(r).toBeInstanceOf(Response);
    expect((r as Response).status).toBe(401);
  });

  it("returns 404 when signed in but neither owner nor participant", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u1",
      name: "X",
      email: null,
      image: null,
    });
    mockGetMatchById.mockResolvedValue(
      makeMatch({ matchId: "m1", createdByUserId: "owner" }),
    );
    mockGetLinkedPlayerByUserId.mockResolvedValue({
      playerId: "pl1",
      name: "Linked",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      userId: "u1",
      profileCompleted: true,
    });
    mockIsPlayerInMatch.mockResolvedValue(false);

    const r = await getMatchReadAccessForApi("m1");
    expect(r).toBeInstanceOf(Response);
    expect((r as Response).status).toBe(404);
  });

  it("allows owner read with sessionWriteEnabled true", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "owner",
      name: "O",
      email: null,
      image: null,
    });
    mockGetMatchById.mockResolvedValue(
      makeMatch({ matchId: "m1", createdByUserId: "owner" }),
    );

    const r = await getMatchReadAccessForApi("m1");
    expect(r).not.toBeInstanceOf(Response);
    if (r instanceof Response) return;
    expect(r.sessionWriteEnabled).toBe(true);
  });

  it("allows participant read with sessionWriteEnabled false", async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: "u1",
      name: "P",
      email: null,
      image: null,
    });
    mockGetMatchById.mockResolvedValue(
      makeMatch({ matchId: "m1", createdByUserId: "owner" }),
    );
    mockGetLinkedPlayerByUserId.mockResolvedValue({
      playerId: "pl1",
      name: "Linked",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      userId: "u1",
      profileCompleted: true,
    });
    mockIsPlayerInMatch.mockResolvedValue(true);

    const r = await getMatchReadAccessForApi("m1");
    expect(r).not.toBeInstanceOf(Response);
    if (r instanceof Response) return;
    expect(r.sessionWriteEnabled).toBe(false);
  });
});

describe("getMatchViewAccessOrNotFound", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns open role for unowned match without user", async () => {
    const match = makeMatch({ matchId: "m1" });
    delete (match as Partial<Match>).createdByUserId;
    mockGetMatchById.mockResolvedValue(match);

    const r = await getMatchViewAccessOrNotFound("m1", null, null);
    expect(r.role).toBe("open");
    expect(r.sessionWriteEnabled).toBe(true);
  });

  it("returns participant for linked player in roster", async () => {
    mockGetMatchById.mockResolvedValue(
      makeMatch({ matchId: "m1", createdByUserId: "owner" }),
    );
    mockIsPlayerInMatch.mockResolvedValue(true);

    const r = await getMatchViewAccessOrNotFound("m1", "u1", "pl1");
    expect(r.role).toBe("participant");
    expect(r.sessionWriteEnabled).toBe(false);
  });
});
