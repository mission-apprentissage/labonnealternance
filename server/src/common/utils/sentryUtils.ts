import * as Sentry from "@sentry/node"

export const sentryCaptureException = (error: any, options?: object): void => {
  Sentry.captureException(error, options)
}

export async function startSentryPerfRecording({ name, operation }: { name: string; operation: string }, callback: () => void) {
  await Sentry.startSpan(
    {
      name,
      op: operation,
    },
    callback
  )
}
