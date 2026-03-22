import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ensureLinkedPlayerForUser,
  getLinkedPlayerByUserId,
} from "@/lib/repositories/playerRepository";
import { getCurrentUser } from "@/lib/getCurrentUser";

const PROFILE_PATH = "/complete-profile";

/** Linked stub players must finish setup; manual players are never incomplete here. */
export function linkedPlayerNeedsProfileCompletion(
  player: { userId?: string; profileCompleted?: boolean } | null,
): boolean {
  if (!player) return false;
  return Boolean(player.userId) && player.profileCompleted === false;
}

/** Paths where incomplete profiles may proceed without redirect (avoid loops). */
export function shouldSkipProfileCompletionGate(pathname: string): boolean {
  return (
    pathname.startsWith(PROFILE_PATH) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login")
  );
}

/**
 * For authenticated shell users: ensure linked player exists; redirect to profile setup if needed.
 * Skips /complete-profile and auth routes. Call from shell layout.
 */
export async function enforceProfileCompleteForShell(): Promise<void> {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (shouldSkipProfileCompletionGate(pathname)) {
    return;
  }

  const user = await getCurrentUser();
  if (!user?.id) return;

  await ensureLinkedPlayerForUser({
    userId: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  });

  const player = await getLinkedPlayerByUserId(user.id);
  if (linkedPlayerNeedsProfileCompletion(player)) {
    redirect(PROFILE_PATH);
  }
}
