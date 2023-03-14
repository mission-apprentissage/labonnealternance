import Sentry from "@sentry/node"

export const sentryCaptureException = (error: object) => Sentry.captureException(error)
