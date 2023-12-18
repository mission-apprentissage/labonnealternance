import { defineConfig } from "cypress"
import * as dotenv from "dotenv"

dotenv.config()

export default defineConfig({
  viewportHeight: 768,
  viewportWidth: 1366,
  e2e: {
    video: false,
    setupNodeEvents(on) {
      configureMongoPlugin(on)
    },
  },
})
