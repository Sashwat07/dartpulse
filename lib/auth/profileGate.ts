import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ensureLinkedPlayerForUser,
  getLinkedPlayerByUserId,
} from "@/lib/repositories/playerRepository";
import { getCurrentUser } from "@/lib/getCurrentUser";

const PROFILE_PATH = "/complete-profile";

function isLinkedProfileIncomplete(player: {
  userId?: string;
  profileCompleted?: boolean;
}): boolean {
  return Boolean(player.userId) && player.profileCompleted === false;
}

/**
 * For authenticated shell users: ensure linked player exists; redirect to profile setup if needed.
 * Skips /complete-profile and auth routes. Call from shell layout.
 */
export async function enforceProfileCompleteForShell(): Promise<void> {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  if (
    pathname.startsWith(PROFILE_PATH) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login")
  ) {
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
  if (player && isLinkedProfileIncomplete(player)) {
    redirect(PROFILE_PATH);
  }
}
