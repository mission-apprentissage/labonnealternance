import Sentry from "@sentry/node"

export const CaptureException = (error: object) => Sentry.captureException(error)
