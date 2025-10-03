import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "src/**/*.test.tsx",
      "src/**/*.test.ts",
      "src/**/__tests__/**/*.test.tsx",
      "src/**/__tests__/**/*.test.tsx",
      "src/**/__tests__/**/*.test.ts",
    ],
    globals: true,
    setupFiles: [],
  },
});
