import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/components/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.ts",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});

