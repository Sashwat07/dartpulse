import type { Metadata } from "next";
import { Inter, Barlow_Semi_Condensed } from "next/font/google";
import Script from "next/script";

import { Providers } from "@/components/Providers";
import { env } from "@/lib/config/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const barlowSemiCondensed = Barlow_Semi_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
      <body className={`${inter.variable} ${barlowSemiCondensed.variable} min-h-dvh bg-background text-foreground antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
