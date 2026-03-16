import { NextResponse } from "next/server";

import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import { undoPlayoffThrow } from "@/lib/playoffUndo";
import { undoPlayoffThrowPayloadSchema } from "@/lib/validators/playoff";

type RouteContext = { params: Promise<{ matchId: string }> };

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

  const result = await undoPlayoffThrow(parentMatchId, playoffMatchId);

  if (result.allowed) {
    return NextResponse.json({ success: true });
  }

  if (result.reason === "match_not_found" || result.reason === "wrong_parent") {
    return NextResponse.json(
      { error: "Playoff match not found" },
      { status: 404 },
    );
  }

  if (result.reason === "no_throw") {
    return NextResponse.json(
      { error: "No throw to undo" },
      { status: 400 },
    );
  }

  if (result.reason === "downstream_has_throws") {
    return NextResponse.json(
      { error: "Cannot undo: a later playoff match already has throws" },
      { status: 409 },
    );
  }

  if (result.reason === "final_confirmed") {
    return NextResponse.json(
      { error: "Final already confirmed; undo is not allowed" },
      { status: 409 },
    );
  }

  return NextResponse.json({ error: "Undo failed" }, { status: 400 });
}
