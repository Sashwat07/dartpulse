import Image from "next/image";
import { redirect } from "next/navigation";

import { GlassCard } from "@/components/GlassCard";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getLinkedPlayerByUserId } from "@/lib/repositories";
import { requireUser } from "@/lib/requireUser";

import { ProfileColorClient } from "./ProfileColorClient";

export default async function ProfilePage() {
  await requireUser();
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");
  const player = await getLinkedPlayerByUserId(user.id);
  if (!player) {
    redirect("/app");
  }

  const avatarSrc = user.image ?? player.avatarUrl ?? null;
  const initial = (player.name || user.name || user.email || "?").slice(0, 1).toUpperCase();
  const color = player.avatarColor ?? "#888888";

  return (
    <PageTransition>
      <PageHeader title="Your profile" description="Linked player identity for matches." />
      <div className="mt-4 space-y-4 max-w-lg">
        <GlassCard className="p-4 flex flex-col sm:flex-row gap-4 items-start">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt=""
              width={72}
              height={72}
              className="rounded-full border border-glassBorder shrink-0"
            />
          ) : (
            <span
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-xl font-black border border-glassBorder"
              style={{ backgroundColor: `${color}33`, color }}
            >
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
              Display name
            </p>
            <p className="text-lg font-bold text-foreground">{player.name}</p>
            {user.email && (
              <p className="text-sm text-mutedForeground truncate">{user.email}</p>
            )}
          </div>
        </GlassCard>

        <ProfileColorClient initialColor={color} />
      </div>
    </PageTransition>
  );
}
