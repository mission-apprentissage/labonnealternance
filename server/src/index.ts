import { config } from "dotenv"

config({ path: ".env" })
config({ path: ".env.local", override: true })

import("./common/sentry/sentry.js")
  .then(async ({ initSentry }) => {
    initSentry()
  })
  .then(async () => {
    // Dynamic import to start server after env are loaded
    return import("./main.js")
  })
