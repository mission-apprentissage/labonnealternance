import { defineConfig } from "cypress"
import * as dotenv from "dotenv"
dotenv.config()

export default defineConfig({
  viewportHeight: 768,
  viewportWidth: 1366,
  env: {
    host: process.env.CYPRESS_HOST,
  },
  e2e: {
    video: false,
  },
})
