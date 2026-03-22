import { describe, expect, it } from "vitest";

import { matchVisibilityWhere } from "@/lib/repositories/matchRepository";

describe("matchVisibilityWhere", () => {
  it("owner-only when there is no linked player id", () => {
    expect(matchVisibilityWhere("user-1", null)).toEqual({
      createdByUserId: "user-1",
    });
    expect(matchVisibilityWhere("user-1", "")).toEqual({
      createdByUserId: "user-1",
    });
  });

  it("includes participated matches when linked player id is set", () => {
    expect(matchVisibilityWhere("user-1", "player-a")).toEqual({
      OR: [
        { createdByUserId: "user-1" },
        { matchPlayers: { some: { playerId: "player-a" } } },
      ],
    });
  });
});
