import Sentry from "@sentry/node"

export const sentryCaptureException = (error: object): void => {
  Sentry.captureException(error)
}
