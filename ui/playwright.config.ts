import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "yarn build && yarn start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: { PLAYWRIGHT_TEST_MODE: "1" },
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
