import { redirect } from "next/navigation";
import { Target } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getCurrentUser } from "@/lib/getCurrentUser";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background dark:bg-[radial-gradient(ellipse_at_top,#0d1525_0%,#080c15_70%)] px-4">
      <div className="w-full max-w-sm">
        {/* Brand header above card */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primaryNeon/30 bg-primaryNeon/10 shadow-[0_0_24px_rgba(0,229,255,0.15)]">
            <Target size={26} className="text-primaryNeon" aria-hidden />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            DartPulse
          </span>
          <p className="text-sm text-mutedForeground">Track every throw. Own every match.</p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-glassBorder bg-glassBackground/90 p-8 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
          <div className="mb-6 text-center">
            <h1 className="font-display text-xl font-bold text-foreground">Sign in</h1>
            <p className="mt-1.5 text-sm text-mutedForeground">
              Continue with Google to access your dashboard
            </p>
          </div>
          <GoogleSignInButton label="Continue with Google" />
          <p className="mt-4 text-center text-xs text-mutedForeground">
            New to DartPulse? Your account is created automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
