import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getCurrentUser } from "@/lib/getCurrentUser";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background dark:bg-[linear-gradient(180deg,#0B0F1A_0%,#0E1628_100%)]">
      {/* Top nav */}
      <header className="border-b border-glassBorder bg-glassBackground/90 px-4 py-3 backdrop-blur-[16px]">
        <div className="mx-auto flex w-full max-w-mainContent items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primaryNeon/60 bg-primaryNeon/10 text-sm font-semibold text-primaryNeon">
              DP
            </span>
            <span className="text-sm font-semibold tracking-wide text-foreground">
              DartPulse
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-button border border-glassBorder bg-glassBackground px-3 py-1.5 text-sm font-medium text-foreground/90 hover:border-primaryNeon/40 hover:bg-surfaceSubtle hover:text-primaryNeon"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="hidden rounded-button border border-primaryNeon/50 bg-primaryNeon/10 px-3 py-1.5 text-sm font-semibold text-primaryNeon transition-colors hover:bg-primaryNeon/20 sm:inline-flex"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + features */}
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto flex w-full max-w-mainContent flex-col gap-12">
          {/* Hero */}
          <section className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
            <div className="space-y-6">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Track every throw. <span className="text-primaryNeon">Own every match.</span>
              </h1>
              <p className="max-w-xl text-sm text-mutedForeground sm:text-base">
                DartPulse turns casual games into a competitive arena-grade experience. Live scoring,
                playoff brackets, and analytics in one neon-lit dashboard.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-button border border-primaryNeon/60 bg-primaryNeon/15 px-4 py-2.5 text-sm font-semibold text-primaryNeon shadow-[0_0_16px_rgba(0,229,255,0.25)] transition-colors hover:bg-primaryNeon/25"
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-mutedForeground hover:text-primaryNeon"
                >
                  Sign in to your dashboard →
                </Link>
              </div>
            </div>

            {/* Feature highlight card */}
            <div className="rounded-2xl border border-glassBorder bg-glassBackground/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur-[20px]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primaryNeon">
                Live match snapshot
              </p>
              <p className="mt-2 text-sm text-mutedForeground">
                See who’s leading, who’s on a streak, and who’s one round away from the playoffs.
              </p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-glassBorder bg-surfaceSubtle px-3 py-2">
                  <span className="font-medium text-foreground">Live scoring</span>
                  <span className="text-xs text-mutedForeground">Instant updates</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-glassBorder bg-surfaceSubtle px-3 py-2">
                  <span className="font-medium text-foreground">Playoff-ready</span>
                  <span className="text-xs text-mutedForeground">Top 4 bracket</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-glassBorder bg-surfaceSubtle px-3 py-2">
                  <span className="font-medium text-foreground">Analytics</span>
                  <span className="text-xs text-mutedForeground">Momentum & trends</span>
                </div>
              </div>
              <div className="mt-4">
                <GoogleSignInButton label="Continue with Google" />
              </div>
            </div>
          </section>

          {/* Feature cards */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
              Built for serious darts nights
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-glassBorder bg-glassBackground/80 p-4">
                <h3 className="text-sm font-semibold text-foreground">Live Scoring</h3>
                <p className="mt-2 text-xs text-mutedForeground">
                  Fast dart-style score input with rotating turn order so recording never slows down
                  the match.
                </p>
              </div>
              <div className="rounded-2xl border border-glassBorder bg-glassBackground/80 p-4">
                <h3 className="text-sm font-semibold text-foreground">Tournament Brackets</h3>
                <p className="mt-2 text-xs text-mutedForeground">
                  Auto-generated playoffs for top four players with qualifier, eliminator, and final
                  flows.
                </p>
              </div>
              <div className="rounded-2xl border border-glassBorder bg-glassBackground/80 p-4">
                <h3 className="text-sm font-semibold text-foreground">Advanced Analytics</h3>
                <p className="mt-2 text-xs text-mutedForeground">
                  Momentum, heatmaps, and player profiles help you understand who really dominated
                  the night.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-glassBorder bg-glassBackground/80 px-4 py-4 text-xs text-mutedForeground">
        <div className="mx-auto flex w-full max-w-mainContent flex-col items-center justify-between gap-2 sm:flex-row">
          <span>© {new Date().getFullYear()} DartPulse</span>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-primaryNeon">
              Privacy
            </Link>
            <Link href="#" className="hover:text-primaryNeon">
              Terms
            </Link>
            <Link href="#" className="hover:text-primaryNeon">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
