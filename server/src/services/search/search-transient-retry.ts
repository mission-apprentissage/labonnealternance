import { MongoServerError } from "mongodb"

import { sentryCaptureException } from "@/common/utils/sentry-utils"

// mongot peut annuler ponctuellement une requête $search/$searchMeta : RPC mongod→mongot
// interrompue (redémarrage/coupure du sidecar) → MongoServerError code 90 "CallbackCanceled"
// (Sentry LBA-SERVER-5J7KF4ZZZT961 : ~150 requêtes/jour finissaient en 500 sur /api/v1/search).
// L'erreur est transitoire : la requête suivante repart sur une connexion saine, un unique
// retry suffit donc à éviter le 500 utilisateur. La capture en warning garde la fréquence du
// repli observable, et l'échec du retry est propagé tel quel (500 + capture Sentry standard).
export function isTransientSearchCancellation(err: unknown): boolean {
  return err instanceof MongoServerError && (err.codeName === "CallbackCanceled" || err.code === 90)
}

export async function retryOnTransientSearchCancellation<T>(run: () => Promise<T>, extra: Record<string, unknown>): Promise<T> {
  try {
    return await run()
  } catch (err) {
    if (!isTransientSearchCancellation(err)) throw err
    sentryCaptureException(err, { level: "warning", extra: { ...extra, fallback: "search-transient-retry" } })
    return run()
  }
}
