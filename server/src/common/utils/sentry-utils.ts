import * as Sentry from "@sentry/node"

export const sentryCaptureException = (error: any, options?: Parameters<typeof Sentry.captureException>[1]): void => {
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

/**
 * Exécute `callback` sans span active. Le SDK rattache chaque span enfant, même non échantillonnée, à la
 * span racine du job jusqu'à la fin de celle-ci ; sans span active, l'instrumentation MongoDB n'en crée
 * aucune. À réserver aux jobs qui enchaînent des centaines de milliers de requêtes (#5607).
 */
export const withoutChildSpans = <T>(callback: () => T): T => Sentry.withActiveSpan(null, callback)
