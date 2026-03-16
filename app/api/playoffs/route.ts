import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ playoffMatches: [] });
}

export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Not implemented (Phase 1 scaffold)." },
    { status: 501 },
  );
}

