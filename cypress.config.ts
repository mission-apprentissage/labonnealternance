import { defineConfig } from "cypress"
import * as dotenv from "dotenv"
dotenv.config()

export default defineConfig({
  viewportHeight: 768,
  viewportWidth: 1366,
  env: {},
  e2e: {
    video: false,
  },
})
