"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import * as React from "react";

export type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="dartpulse-theme">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

