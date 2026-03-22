import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { getMatchWriteAccessForApi } from "@/lib/auth/matchAccess";
import { getMatchById } from "@/lib/repositories";
import type { Match } from "@/types/match";

/**
 * Fetches a match and ensures the current user owns it.
 * Use in server components and route handlers for live match, playoffs, and history detail.
 * Returns the match if createdByUserId === userId; otherwise calls notFound() (no leak of existence).
 */
export async function getOwnedMatchOrThrow(
  matchId: string,
  userId: string,
): Promise<Match> {
  const match = await getMatchById(matchId);
  if (!match || match.createdByUserId !== userId) {
    notFound();
  }
  return match;
}

export type OwnedMatchApiContext = {
  /** Null for unowned matches scored without a signed-in user. */
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  match: Match;
};

/**
 * Use in API route handlers that mutate match state. Unowned matches allow null user; owned matches require the owner.
 * Returns 401/404 as appropriate. Otherwise returns { user, match } for use in the handler.
 */
export async function getOwnedMatchForApi(
  matchId: string,
): Promise<NextResponse | OwnedMatchApiContext> {
  return getMatchWriteAccessForApi(matchId);
}
