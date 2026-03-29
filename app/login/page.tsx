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
    <div
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4"
      style={{ background: "var(--background)" }}
    >
      {/* Subtle depth blobs */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 15% 40%, rgba(0,229,255,0.06) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 85% 25%, rgba(100,60,255,0.04) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {/* Badge pill */}
          <div
            className="mb-2 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide text-mutedForeground"
            style={{
              background: "var(--surfaceSubtle)",
              border: "1px solid var(--glassBorder)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-primaryNeon/70"
            />
            Track every throw
          </div>

          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "var(--glassBackground)",
              boxShadow: "var(--panelShadow), 0 0 28px rgba(0,229,255,0.15)",
            }}
          >
            <Target size={26} className="text-primaryNeon" aria-hidden />
          </div>

          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            DartPulse
          </span>
          <p className="text-sm text-mutedForeground">
            Own every match.
          </p>
        </div>

        {/* Auth card — neumorphic raised surface */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--glassBackground)",
            boxShadow: "var(--panelShadow)",
          }}
        >
          <div className="mb-6 text-center">
            <h1 className="font-display text-xl font-bold text-foreground">Sign in</h1>
            <p className="mt-1.5 text-sm text-mutedForeground">
              Continue with Google to access your dashboard
            </p>
          </div>
          <GoogleSignInButton label="Continue with Google" />
          <p className="mt-4 text-center text-xs text-mutedForeground/70">
            New to DartPulse? Your account is created automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
