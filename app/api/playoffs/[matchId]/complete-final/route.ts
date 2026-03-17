import { NextResponse } from "next/server";

import { evaluateMatchAchievements } from "@/lib/achievements/evaluator";
import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import {
  getPlayoffMatchById,
  updateMatchToFinished,
  updatePlayoffMatchStatus,
} from "@/lib/repositories";
import { undoPlayoffThrowPayloadSchema } from "@/lib/validators/playoff";

type RouteContext = { params: Promise<{ matchId: string }> };

/**
 * POST: Confirm the playoff final (Match complete).
 * Only valid when the match is the final and status is provisionalCompleted.
 * After confirmation, status becomes completed and undo is no longer allowed.
 */
export async function POST(req: Request, context: RouteContext) {
  const { matchId: parentMatchId } = await context.params;
  const auth = await getOwnedMatchForApi(parentMatchId);
  if (auth instanceof NextResponse) return auth;

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = undoPlayoffThrowPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { playoffMatchId } = parsed.data;

  const playoffMatch = await getPlayoffMatchById(playoffMatchId);
  if (playoffMatch === null || playoffMatch.parentMatchId !== parentMatchId) {
    return NextResponse.json(
      { error: "Playoff match not found" },
      { status: 404 },
    );
  }
  if (playoffMatch.stage !== "final") {
    return NextResponse.json(
      { error: "Only the final can be confirmed" },
      { status: 400 },
    );
  }
  if (playoffMatch.status !== "provisionalCompleted") {
    return NextResponse.json(
      { error: "Final is not in provisional state" },
      { status: 400 },
    );
  }

  await updatePlayoffMatchStatus(playoffMatchId, "completed");
  await updateMatchToFinished(parentMatchId);
  await evaluateMatchAchievements(parentMatchId);

  return NextResponse.json({ success: true });
}
