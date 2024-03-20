import Sentry from "@sentry/node"

export const sentryCaptureException = (error: any, options?: object): void => {
  Sentry.captureException(error, options)
}
