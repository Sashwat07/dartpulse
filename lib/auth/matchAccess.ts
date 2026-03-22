import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/getCurrentUser";
import {
  getLinkedPlayerByUserId,
  getMatchById,
  isPlayerInMatch,
} from "@/lib/repositories";
import type { Match } from "@/types/match";

export type MatchPageAccessRole = "owner" | "participant" | "open";

export type MatchPageAccess = {
  match: Match;
  role: MatchPageAccessRole;
  /** False when user may view but must not mutate (participant on owned match). */
  sessionWriteEnabled: boolean;
};

/**
 * True when the match has no owner (legacy / anonymous-created); device-local scoring is allowed without login.
 */
function isOpenMatch(match: Match): boolean {
  return match.createdByUserId == null || match.createdByUserId === "";
}

/**
 * Server component / RSC: resolve whether the user may view this match page.
 * - Open (unowned) matches: anyone.
 * - Owned matches: owner or linked participant only.
 */
export async function getMatchViewAccessOrNotFound(
  matchId: string,
  userId: string | null,
  linkedPlayerId: string | null,
): Promise<MatchPageAccess> {
  const match = await getMatchById(matchId);
  if (!match) notFound();

  if (isOpenMatch(match)) {
    return { match, role: "open", sessionWriteEnabled: true };
  }

  const ownerId = match.createdByUserId!;
  if (userId && userId === ownerId) {
    return { match, role: "owner", sessionWriteEnabled: true };
  }

  if (userId && linkedPlayerId) {
    const participates = await isPlayerInMatch(matchId, linkedPlayerId);
    if (participates) {
      return { match, role: "participant", sessionWriteEnabled: false };
    }
  }

  notFound();
}

export type MatchReadApiResult =
  | NextResponse
  | {
      match: Match;
      user: { id: string; name?: string | null; email?: string | null } | null;
      sessionWriteEnabled: boolean;
    };

/**
 * API GET handlers: load match if caller may read state (owner, participant, or open match).
 */
export async function getMatchReadAccessForApi(
  matchId: string,
): Promise<MatchReadApiResult> {
  const user = await getCurrentUser();
  const match = await getMatchById(matchId);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isOpenMatch(match)) {
    return { match, user, sessionWriteEnabled: true };
  }

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (match.createdByUserId === user.id) {
    return { match, user, sessionWriteEnabled: true };
  }

  const linked = await getLinkedPlayerByUserId(user.id);
  if (linked && (await isPlayerInMatch(matchId, linked.playerId))) {
    return { match, user, sessionWriteEnabled: false };
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export type MatchWriteApiResult =
  | NextResponse
  | { match: Match; user: { id: string; name?: string | null; email?: string | null; image?: string | null } | null };

/**
 * API mutation handlers: only match owner, or anyone for unowned matches.
 */
export async function getMatchWriteAccessForApi(
  matchId: string,
): Promise<MatchWriteApiResult> {
  const user = await getCurrentUser();
  const match = await getMatchById(matchId);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sessionUser =
    user?.id != null && user.id !== ""
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      : null;

  if (isOpenMatch(match)) {
    return { match, user: sessionUser };
  }

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (match.createdByUserId !== sessionUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return { match, user: sessionUser };
}

/**
 * History detail: owner or participant may view completed match analytics.
 */
export async function assertHistoryMatchViewable(
  matchId: string,
  userId: string,
  linkedPlayerId: string | null,
): Promise<Match> {
  const { match } = await getMatchViewAccessOrNotFound(
    matchId,
    userId,
    linkedPlayerId,
  );
  return match;
}
