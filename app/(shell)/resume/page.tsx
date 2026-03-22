import { listOwnedResumableMatches } from "@/lib/repositories";
import { requireUser } from "@/lib/requireUser";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { ResumeCardList } from "@/components/resume/ResumeCardList";

export default async function ResumePage() {
  const user = await requireUser();
  const items = await listOwnedResumableMatches(user.id);

  return (
    <PageTransition>
      <PageHeader
        title="Resume"
        description="Continue where you left off."
      />
      <div className="mt-4">
        <ResumeCardList items={items} />
      </div>
    </PageTransition>
  );
}
