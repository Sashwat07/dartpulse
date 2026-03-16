import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryNeon: "var(--primaryNeon)",
        championGold: "var(--championGold)",
        primaryForeground: "var(--primaryForeground)",
        glassBackground: "var(--glassBackground)",
        glassBorder: "var(--glassBorder)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        mutedForeground: "var(--mutedForeground)",
        surfaceSubtle: "var(--surfaceSubtle)",
        surfaceHover: "var(--surfaceHover)",
        surfaceMuted: "var(--surfaceMuted)",
        destructive: "var(--destructive)",
      },
      boxShadow: {
        panelShadow: "var(--panelShadow)",
        glowShadow: "var(--glowShadow)",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
      },
      maxWidth: {
        mainContent: "1440px",
      },
    },
  },
  plugins: [],
} satisfies Config;

