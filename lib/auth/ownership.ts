import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/getCurrentUser";
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
  user: { id: string };
  match: Match;
};

/**
 * Use in API route handlers that accept matchId. Ensures the caller is authenticated and owns the match.
 * Returns 401 if unauthenticated, 404 if match missing or not owned (no resource existence leak).
 * Otherwise returns { user, match } for use in the handler.
 */
export async function getOwnedMatchForApi(
  matchId: string,
): Promise<NextResponse | OwnedMatchApiContext> {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const match = await getMatchById(matchId);
  if (!match || match.createdByUserId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return { user, match };
}
