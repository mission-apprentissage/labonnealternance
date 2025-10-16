import { defineConfig } from "cypress"
import * as dotenv from "dotenv"

import { setupNodeEvents } from "./cypress/plugin/configure"

dotenv.config()

export default defineConfig({
  defaultCommandTimeout: 20000,
  viewportHeight: 768,
  viewportWidth: 1366,
  e2e: {
    video: false,
    setupNodeEvents,
  },
})
