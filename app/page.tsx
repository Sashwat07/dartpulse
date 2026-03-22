import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Shield, Target, Trophy, Zap } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getCurrentUser } from "@/lib/getCurrentUser";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background dark:bg-[radial-gradient(ellipse_at_top,#0d1525_0%,#080c15_60%)]">
      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b border-glassBorder bg-glassBackground/80 px-4 py-3 backdrop-blur-[20px]">
        <div className="mx-auto flex w-full max-w-mainContent items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primaryNeon/30 bg-primaryNeon/10">
              <Target size={16} className="text-primaryNeon" aria-hidden />
            </span>
            <span className="font-display text-base font-bold tracking-wide text-foreground">
              DartPulse
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-button border border-glassBorder bg-glassBackground px-3 py-1.5 text-sm font-medium text-mutedForeground hover:border-primaryNeon/30 hover:bg-surfaceSubtle hover:text-primaryNeon transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="hidden rounded-button border border-primaryNeon/40 bg-primaryNeon/10 px-3 py-1.5 text-sm font-semibold text-primaryNeon transition-colors hover:bg-primaryNeon/20 sm:inline-flex"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + features */}
      <main className="flex-1 px-4 py-14 md:py-20">
        <div className="mx-auto flex w-full max-w-mainContent flex-col gap-16">
          {/* Hero */}
          <section className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)] items-center">
            <div className="space-y-7">
              {/* Eyebrow */}
              <p className="inline-flex items-center gap-2 rounded-full border border-primaryNeon/30 bg-primaryNeon/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primaryNeon">
                <Zap size={11} aria-hidden />
                Live darts scoring &amp; analytics
              </p>

              <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Track every throw.{" "}
                <span className="text-primaryNeon drop-shadow-[0_0_20px_rgba(0,229,255,0.35)]">
                  Own every match.
                </span>
              </h1>

              <p className="max-w-lg text-base text-mutedForeground leading-relaxed sm:text-lg">
                DartPulse turns casual darts nights into a competitive arena-grade experience.
                Live scoring, playoff brackets, and deep analytics in one sleek dashboard.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-button border border-primaryNeon/50 bg-primaryNeon/12 px-5 py-3 text-sm font-semibold text-primaryNeon shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all hover:bg-primaryNeon/20 hover:shadow-[0_0_28px_rgba(0,229,255,0.3)] active:scale-[0.98]"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-mutedForeground hover:text-primaryNeon transition-colors"
                >
                  Sign in to your dashboard →
                </Link>
              </div>
            </div>

            {/* Auth / feature highlight card */}
            <div className="rounded-2xl border border-glassBorder bg-glassBackground/90 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-[24px]">
              <div className="mb-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primaryNeon">
                  Ready to start scoring?
                </p>
              </div>
              <p className="mb-5 text-sm text-mutedForeground">
                Join in seconds. Your stats, rankings, and history are waiting.
              </p>

              <div className="mb-5 space-y-2">
                {[
                  { label: "Live scoring", sub: "Instant round updates" },
                  { label: "Playoff brackets", sub: "Top 4 auto-generated" },
                  { label: "Deep analytics", sub: "Momentum, heatmaps & trends" },
                ].map((feat) => (
                  <div
                    key={feat.label}
                    className="flex items-center justify-between rounded-xl border border-glassBorder bg-surfaceSubtle px-4 py-2.5"
                  >
                    <span className="text-sm font-medium text-foreground">{feat.label}</span>
                    <span className="text-xs text-mutedForeground">{feat.sub}</span>
                  </div>
                ))}
              </div>

              <GoogleSignInButton label="Continue with Google" />
            </div>
          </section>

          {/* Feature cards */}
          <section className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">
                Built for serious darts nights
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Target,
                  title: "Live Scoring",
                  desc: "Fast dart-style score input with rotating turn order so recording never slows down the match.",
                },
                {
                  icon: Trophy,
                  title: "Tournament Brackets",
                  desc: "Auto-generated playoffs for top four: Q1 and eliminator (3rd vs 4th), then qualifier 2 and a grand final.",
                },
                {
                  icon: BarChart3,
                  title: "Advanced Analytics",
                  desc: "Momentum timelines, round heatmaps, and player profiles help you see who really dominated.",
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="group rounded-2xl border border-glassBorder bg-glassBackground/80 p-5 transition-colors hover:border-primaryNeon/25 hover:bg-surfaceSubtle"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-glassBorder bg-surfaceSubtle group-hover:border-primaryNeon/25 group-hover:bg-primaryNeon/8 transition-colors">
                      <Icon size={18} className="text-mutedForeground group-hover:text-primaryNeon transition-colors" aria-hidden />
                    </div>
                    <h3 className="font-display text-base font-bold text-foreground">{feat.title}</h3>
                    <p className="mt-2 text-sm text-mutedForeground leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Trust bar */}
          <section className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-glassBorder bg-surfaceSubtle/50 px-6 py-5">
            {[
              { icon: Shield, text: "Auth secured by Google" },
              { icon: Zap, text: "Real-time scoring" },
              { icon: BarChart3, text: "Complete match history" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs font-medium text-mutedForeground">
                <Icon size={14} className="text-primaryNeon/70 shrink-0" aria-hidden />
                {text}
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-glassBorder bg-glassBackground/60 px-4 py-4 text-xs text-mutedForeground">
        <div className="mx-auto flex w-full max-w-mainContent flex-col items-center justify-between gap-2 sm:flex-row">
          <span>© {new Date().getFullYear()} DartPulse</span>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-primaryNeon transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-primaryNeon transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-primaryNeon transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
