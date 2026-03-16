import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/getCurrentUser";

/**
 * Use in server components for routes that require authentication.
 * Redirects to custom login page if no session. Returns the current user otherwise.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
