import { config } from "dotenv"

config({ path: ".env" })
config({ path: ".env.local", override: true })

// eslint-disable-next-line @typescript-eslint/no-floating-promises
import("./common/sentry/sentry.js")
  .then(async ({ initSentry }) => {
    initSentry()
  })
  .then(async () => {
    // Dynamic import to start server after env are loaded
    return import("./main.js")
  })
