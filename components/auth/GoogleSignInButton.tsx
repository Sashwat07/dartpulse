"use client";

import { signIn } from "next-auth/react";

type GoogleSignInButtonProps = {
  label?: string;
};

export function GoogleSignInButton({ label = "Continue with Google" }: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/app" })}
      className="flex w-full items-center justify-center gap-2 rounded-button border border-primaryNeon/60 bg-primaryNeon/10 px-4 py-2.5 text-sm font-semibold text-primaryNeon transition-colors hover:bg-primaryNeon/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs font-bold text-primaryNeon">
        G
      </span>
      <span>{label}</span>
    </button>
  );
}

