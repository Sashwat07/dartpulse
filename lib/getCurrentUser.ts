import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

/**
 * Returns the current session user, or null if not authenticated.
 * Use in server components and route handlers for auth and ownership checks.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
