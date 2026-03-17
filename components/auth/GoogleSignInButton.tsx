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
      className="flex w-full items-center justify-center gap-2.5 rounded-button border border-primaryNeon/50 bg-primaryNeon/10 px-4 py-3 text-sm font-semibold text-primaryNeon shadow-[0_0_16px_rgba(0,229,255,0.15)] transition-all hover:bg-primaryNeon/18 hover:shadow-[0_0_24px_rgba(0,229,255,0.25)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
    >
      {/* Google "G" icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
          fill="currentColor"
          opacity="0.9"
        />
        <path
          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
