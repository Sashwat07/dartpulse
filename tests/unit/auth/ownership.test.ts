import { describe, expect, it, vi, beforeEach } from "vitest";

const NOT_FOUND = new Error("NOT_FOUND");
vi.mock("next/navigation", () => ({ notFound: () => { throw NOT_FOUND; } }));

vi.mock("@/lib/repositories", () => ({
  getMatchById: vi.fn(),
}));

vi.mock("@/lib/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}));

import { getMatchById } from "@/lib/repositories";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getOwnedMatchOrThrow, getOwnedMatchForApi } from "@/lib/auth/ownership";
import type { Match } from "@/types/match";

const mockGetMatchById = vi.mocked(getMatchById);
const mockGetCurrentUser = vi.mocked(getCurrentUser);

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

describe("getOwnedMatchOrThrow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns match when it exists and createdByUserId matches userId", async () => {
    const match = makeMatch({ matchId: "m1", createdByUserId: "user-1" });
    mockGetMatchById.mockResolvedValue(match);

    const result = await getOwnedMatchOrThrow("m1", "user-1");
    expect(result).toEqual(match);
    expect(mockGetMatchById).toHaveBeenCalledWith("m1");
  });

  it("throws notFound when match is null", async () => {
    mockGetMatchById.mockResolvedValue(null);

    await expect(getOwnedMatchOrThrow("m1", "user-1")).rejects.toThrow(NOT_FOUND);
    expect(mockGetMatchById).toHaveBeenCalledWith("m1");
  });

  it("throws notFound when match exists but createdByUserId does not match", async () => {
    const match = makeMatch({ matchId: "m1", createdByUserId: "other-user" });
    mockGetMatchById.mockResolvedValue(match);

    await expect(getOwnedMatchOrThrow("m1", "user-1")).rejects.toThrow(NOT_FOUND);
    expect(mockGetMatchById).toHaveBeenCalledWith("m1");
  });

  it("throws notFound when match has no owner (legacy)", async () => {
    const match = makeMatch({ matchId: "m1" });
    delete (match as Partial<Match>).createdByUserId;
    mockGetMatchById.mockResolvedValue(match);

    await expect(getOwnedMatchOrThrow("m1", "user-1")).rejects.toThrow(NOT_FOUND);
  });
});

describe("getOwnedMatchForApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { user: null, match } when user is not authenticated and match is unowned", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const match = makeMatch({ matchId: "m1" });
    delete (match as Partial<Match>).createdByUserId;
    mockGetMatchById.mockResolvedValue(match);

    const result = await getOwnedMatchForApi("m1");
    expect(result).not.toBeInstanceOf(Response);
    expect(result).toEqual({ user: null, match });
    expect(mockGetMatchById).toHaveBeenCalledWith("m1");
  });

  it("returns 401 when user is not authenticated and match is owned", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const match = makeMatch({ matchId: "m1", createdByUserId: "user-1" });
    mockGetMatchById.mockResolvedValue(match);

    const result = await getOwnedMatchForApi("m1");
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(mockGetMatchById).toHaveBeenCalledWith("m1");
  });

  it("returns 401 when user has no id and match is owned", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "", name: null, email: null, image: null });
    const match = makeMatch({ matchId: "m1", createdByUserId: "user-1" });
    mockGetMatchById.mockResolvedValue(match);

    const result = await getOwnedMatchForApi("m1");
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  it("returns 404 when match is null", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: null, email: null, image: null });
    mockGetMatchById.mockResolvedValue(null);

    const result = await getOwnedMatchForApi("m1");
    expect(result).toBeInstanceOf(Response);
    const res = result as Response;
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    expect(mockGetMatchById).toHaveBeenCalledWith("m1");
  });

  it("returns 404 when match is not owned by user", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", name: null, email: null, image: null });
    const match = makeMatch({ matchId: "m1", createdByUserId: "other-user" });
    mockGetMatchById.mockResolvedValue(match);

    const result = await getOwnedMatchForApi("m1");
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(404);
  });

  it("returns { user, match } when authenticated and match is owned", async () => {
    const user = { id: "user-1", name: "Test", email: null, image: null };
    mockGetCurrentUser.mockResolvedValue(user);
    const match = makeMatch({ matchId: "m1", createdByUserId: "user-1" });
    mockGetMatchById.mockResolvedValue(match);

    const result = await getOwnedMatchForApi("m1");
    expect(result).not.toBeInstanceOf(Response);
    expect(result).toEqual({ user, match });
    expect(mockGetMatchById).toHaveBeenCalledWith("m1");
  });

  it("returns { user, match } when authenticated and match is unowned", async () => {
    const user = { id: "user-1", name: "Test", email: null, image: null };
    mockGetCurrentUser.mockResolvedValue(user);
    const match = makeMatch({ matchId: "m1" });
    delete (match as Partial<Match>).createdByUserId;
    mockGetMatchById.mockResolvedValue(match);

    const result = await getOwnedMatchForApi("m1");
    expect(result).not.toBeInstanceOf(Response);
    expect(result).toEqual({ user, match });
  });
});
