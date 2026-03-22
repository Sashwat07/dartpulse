import { redirect } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { PageTransition } from "@/components/motion/PageTransition";
import { getLinkedPlayerByUserId } from "@/lib/repositories";
import { requireUser } from "@/lib/requireUser";

import { CompleteProfileForm } from "./CompleteProfileForm";

export default async function CompleteProfilePage() {
  const user = await requireUser();
  const player = await getLinkedPlayerByUserId(user.id);
  if (!player || player.profileCompleted !== false) {
    redirect("/app");
  }

  return (
    <PageTransition>
      <PageHeader
        title="Profile setup"
        description="One quick step before you use DartPulse."
      />
      <div className="mt-4">
        <CompleteProfileForm />
      </div>
    </PageTransition>
  );
}
