import Sentry from "@sentry/node"

export const sentryCaptureException = (error: any): void => {
  Sentry.captureException(error)
}
