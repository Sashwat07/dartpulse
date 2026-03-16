import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getCurrentUser } from "@/lib/getCurrentUser";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background dark:bg-[linear-gradient(180deg,#0B0F1A_0%,#0E1628_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-glassBorder bg-glassBackground/90 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-[20px]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primaryNeon/60 bg-primaryNeon/10 text-sm font-semibold text-primaryNeon">
              DP
            </span>
            <span className="text-base font-semibold tracking-wide text-primaryNeon">
              DartPulse
            </span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
          <p className="max-w-xs text-sm text-mutedForeground">
            Track your performance, dominate the board. Continue with Google to get started.
          </p>
        </div>
        <GoogleSignInButton label="Continue with Google" />
      </div>
    </div>
  );
}

