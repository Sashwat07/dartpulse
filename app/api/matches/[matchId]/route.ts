import { NextResponse } from "next/server";

import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import type { GetMatchResponse } from "@/types/dto";

type RouteContext = {
  params: Promise<{ matchId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const auth = await getOwnedMatchForApi(matchId);
  if (auth instanceof NextResponse) return auth;
  const body: GetMatchResponse = {
    match: null,
    matchId,
  };
  return NextResponse.json(body);
}

export async function PATCH() {
  return NextResponse.json(
    { ok: false, message: "Not implemented (Phase 4+)." },
    { status: 501 },
  );
}

