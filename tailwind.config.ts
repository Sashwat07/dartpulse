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
        surface1: "var(--surface1)",
        surface2: "var(--surface2)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        mutedForeground: "var(--mutedForeground)",
        surfaceSubtle: "var(--surfaceSubtle)",
        surfaceHover: "var(--surfaceHover)",
        surfaceMuted: "var(--surfaceMuted)",
        destructive: "var(--destructive)",
        sidebarBg: "var(--sidebarBg)",
        sidebarBorder: "var(--sidebarBorder)",
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panelShadow: "var(--panelShadow)",
        insetShadow: "var(--insetShadow)",
        glowShadow: "var(--glowShadow)",
        glowStrong: "0 0 30px rgba(0, 229, 255, 0.35)",
      },
      borderRadius: {
        card: "var(--radius-card, 20px)",
        button: "var(--radius-button, 999px)",
      },
      maxWidth: {
        mainContent: "1440px",
      },
    },
  },
  plugins: [],
} satisfies Config;
