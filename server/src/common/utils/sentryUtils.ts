import Sentry from "@sentry/node"

export const sentryCaptureException = (error: any, options?: object): void => {
  Sentry.captureException(error, options)
}

function getTransaction() {
  return Sentry.getCurrentHub()?.getScope()?.getSpan()
}

export function startSentryPerfRecording(
  category: string,
  operation: string,
  data?: {
    [key: string]: any
  }
): () => void {
  const childTransaction =
    getTransaction()?.startChild({
      op: category,
      description: operation,
      data,
    }) ?? null

  return () => {
    childTransaction?.finish()
  }
}
