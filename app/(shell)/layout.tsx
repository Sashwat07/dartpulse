import { AppShell } from "@/components/AppShell";
import { enforceProfileCompleteForShell } from "@/lib/auth/profileGate";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforceProfileCompleteForShell();
  return <AppShell>{children}</AppShell>;
}
