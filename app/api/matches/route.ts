import { NextResponse } from "next/server";

import type { CreateMatchResponse } from "@/types/dto";
import { listMatches } from "@/lib/repositories";
import { bootstrapMatch } from "@/lib/services/matchBootstrapService";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createMatchPayloadSchema } from "@/lib/validators";

export async function GET() {
  const matches = await listMatches();
  return NextResponse.json({
    matches: matches.map((m) => ({
      matchId: m.matchId,
      name: m.name,
      mode: m.mode,
      status: m.status,
      totalRounds: m.totalRounds,
    })),
  });
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }
  const raw = await req.json().catch(() => ({}));
  const parsed = createMatchPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const user = await getCurrentUser();
  const match = await bootstrapMatch({
    ...parsed.data,
    createdByUserId: user?.id,
  });
  const body: CreateMatchResponse = { matchId: match.matchId };
  return NextResponse.json(body, { status: 201 });
}
