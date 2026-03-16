import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/getCurrentUser";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  redirect("/login");
}

