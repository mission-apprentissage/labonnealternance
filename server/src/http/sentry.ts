import { CaptureConsole, ExtraErrorData } from "@sentry/integrations"
import Sentry from "@sentry/node"
import { Express } from "express"

import config from "../config.js"

export function initSentry(app: Express) {
  if (config.env === "dev") {
    console.warn("Sentry deactivated.")
    return
  }

  Sentry.init({
    dsn: config.serverSentryDsn,
    tracesSampleRate: 0.1,
    tracePropagationTargets: [/\.apprentissage\.beta\.gouv\.fr$/],
    environment: config.env,
    enabled: config.env === "production",
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Mongoose query tracing
      new Sentry.Integrations.Mongo({ useMongoose: true }),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // enable capture all console api errors
      new CaptureConsole({ levels: ["error"] }),
      // add all extra error data into the event
      new ExtraErrorData({ depth: 8 }),
    ],
  })

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler())
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler())

  app.use(Sentry.Handlers.errorHandler())
}
