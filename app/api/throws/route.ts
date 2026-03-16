import { NextResponse } from "next/server";

import { addThrowPayloadSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { ok: false, message: "Not implemented (Phase 5)." },
      { status: 501 },
    );
  }
  const raw = await req.json().catch(() => ({}));
  const parsed = addThrowPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Validation failed", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { ok: false, message: "Not implemented (Phase 5)." },
    { status: 501 },
  );
}

