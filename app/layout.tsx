import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { Providers } from "@/components/Providers";
import { env } from "@/lib/config/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_APP_NAME,
  description: "Track Every Throw. Own Every Match.",
};

/** Runs before paint so theme is applied immediately (no flash). */
const themeScript = `
(function(){
  var t = localStorage.getItem('dartpulse-theme');
  document.documentElement.classList.toggle('dark', t !== 'light');
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-dvh bg-background text-foreground antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
