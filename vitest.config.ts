import path from "node:path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./server/src"),
            "@tests": path.resolve(__dirname, "./server/tests"),
          },
        },
        test: {
          name: { label: "server", color: "blue" },
          root: "./server",
          include: ["./tests/**/*.test.ts", "**/*.test.ts"],
          setupFiles: ["./tests/utils/setup.ts"],
          globalSetup: ["./server/tests/utils/globalSetup.ts"],
          clearMocks: true,
          sequence: {
            // Important for useMongo to be sequential
            hooks: "stack",
          },
        },
      },
      {
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./ui"),
          },
        },
        test: {
          name: "ui",
          root: "./ui",
          include: ["./**/*.test.(js|jsx|ts|tsx)"],
          setupFiles: ["./tests/setup.ts"],
        },
      },
      {
        test: {
          name: "shared",
          root: "./shared",
          include: ["**/*.test.ts"],
        },
      },
    ],
  },
})
