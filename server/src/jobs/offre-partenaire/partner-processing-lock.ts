import { AsyncLocalStorage } from "node:async_hooks"
import { MongoServerError, ObjectId } from "mongodb"

import { logger } from "@/common/logger"
import { sleep } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"

/**
 * Durée de vie d'un verrou non rafraîchi : même délai que STALE_PROCESS_ID_AFTER_MS
 * (process-job-partners-for-api.ts). Un traitement tué net libère ses verrous au plus tard après ce délai ;
 * un traitement vivant les rafraîchit au tiers de ce délai, quelle que soit sa durée.
 */
export const PARTNER_LOCK_TTL_MS = 60 * 60 * 1000
const DEFAULT_POLL_INTERVAL_MS = 30 * 1000

export class PartnerLockUnavailableError extends Error {
  constructor(readonly partnerLabels: string[]) {
    super(`verrou partenaire indisponible pour ${partnerLabels.join(", ")} : un autre traitement est en cours sur ce partenaire`)
    this.name = "PartnerLockUnavailableError"
  }
}

const heldPartnerLabels = new AsyncLocalStorage<ReadonlySet<string>>()

const lockCollection = () => getDbCollection("jobs_partners_processing_locks")

/** Tentative unique, sans attente. Réacquérir un verrou déjà détenu par `owner` le prolonge. */
export const acquirePartnerLock = async (partnerLabel: string, owner: string, ttlMs: number = PARTNER_LOCK_TTL_MS): Promise<boolean> => {
  const now = new Date()
  try {
    await lockCollection().updateOne(
      { _id: partnerLabel, $or: [{ owner }, { expires_at: { $not: { $gt: now } } }] },
      { $set: { partner_label: partnerLabel, owner, acquired_at: now, expires_at: new Date(now.getTime() + ttlMs) } },
      { upsert: true }
    )
    return true
  } catch (err) {
    // le filtre n'a rien trouvé parce qu'un autre traitement détient le verrou : l'upsert bute sur l'unicité de _id
    if (err instanceof MongoServerError && err.code === 11000) {
      return false
    }
    throw err
  }
}

export const releasePartnerLock = async (partnerLabel: string, owner: string): Promise<void> => {
  await lockCollection().deleteOne({ _id: partnerLabel, owner })
}

/** Vrai si un traitement autre que `exceptOwner` détient un verrou non expiré sur ce partenaire. */
export const isPartnerLocked = async (partnerLabel: string, { exceptOwner }: { exceptOwner?: string } = {}): Promise<boolean> => {
  const lock = await lockCollection().findOne({ _id: partnerLabel, expires_at: { $gt: new Date() } })
  return lock !== null && lock.owner !== exceptOwner
}

const refreshPartnerLocks = async (partnerLabels: string[], owner: string, ttlMs: number) => {
  if (!partnerLabels.length) return
  const { matchedCount } = await lockCollection().updateMany({ _id: { $in: partnerLabels }, owner }, { $set: { expires_at: new Date(Date.now() + ttlMs) } })
  if (matchedCount < partnerLabels.length) {
    const error = new Error(`verrou partenaire perdu en cours de traitement (${matchedCount}/${partnerLabels.length} rafraîchis) pour ${partnerLabels.join(", ")}`)
    logger.error(error)
    sentryCaptureException(error)
  }
}

type WithPartnerLocksOptions = {
  /** Attente maximale des verrous détenus par d'autres traitements (0 : une seule tentative). */
  waitMs?: number
  ttlMs?: number
  pollIntervalMs?: number
  /** true : échoue avec PartnerLockUnavailableError si un verrou manque à l'issue de l'attente ; false : `fn` reçoit les seuls partenaires verrouillés. */
  requireAll?: boolean
}

/**
 * Exécute `fn` en détenant les verrous des partenaires demandés, puis les libère.
 * Réentrant : un appel imbriqué ne réacquiert ni ne libère les verrous déjà détenus par l'appel englobant
 * (ex. le cycle d'un partenaire qui appelle rawToComputedJobsPartners).
 */
export const withPartnerLocks = async <T>(
  partnerLabels: readonly string[],
  fn: (lockedPartnerLabels: string[]) => Promise<T>,
  { waitMs = 0, ttlMs = PARTNER_LOCK_TTL_MS, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS, requireAll = true }: WithPartnerLocksOptions = {}
): Promise<T> => {
  const alreadyHeld = heldPartnerLabels.getStore() ?? new Set<string>()
  const owner = new ObjectId().toString()
  const acquired: string[] = []
  const deadline = Date.now() + waitMs

  const tryAcquireMissing = async () => {
    for (const partnerLabel of partnerLabels) {
      if (alreadyHeld.has(partnerLabel) || acquired.includes(partnerLabel)) continue
      if (await acquirePartnerLock(partnerLabel, owner, ttlMs)) {
        acquired.push(partnerLabel)
      }
    }
  }
  const missing = () => partnerLabels.filter((partnerLabel) => !alreadyHeld.has(partnerLabel) && !acquired.includes(partnerLabel))

  // Démarré avant l'attente : un verrou obtenu au premier essai expirerait sinon pendant qu'on attend les autres.
  // `acquired` est lu à chaque tick, les verrous obtenus ensuite sont donc rafraîchis aussi.
  const heartbeat = setInterval(() => {
    refreshPartnerLocks(acquired, owner, ttlMs).catch((err) => {
      logger.error(err, "échec du rafraîchissement des verrous partenaires")
      sentryCaptureException(err)
    })
  }, ttlMs / 3)
  heartbeat.unref()
  try {
    await tryAcquireMissing()
    while (missing().length && Date.now() < deadline) {
      logger.info({ missing: missing(), owner }, "attente des verrous partenaires")
      await sleep(Math.min(pollIntervalMs, Math.max(deadline - Date.now(), 0)))
      await tryAcquireMissing()
    }

    const unavailable = missing()
    if (unavailable.length && requireAll) {
      throw new PartnerLockUnavailableError(unavailable)
    }
    if (unavailable.length) {
      logger.warn({ unavailable, owner }, "partenaires ignorés : verrou détenu par un autre traitement")
    }

    const locked = partnerLabels.filter((partnerLabel) => !unavailable.includes(partnerLabel))
    return await heldPartnerLabels.run(new Set([...alreadyHeld, ...acquired]), () => fn(locked))
  } finally {
    clearInterval(heartbeat)
    for (const partnerLabel of acquired) {
      await releasePartnerLock(partnerLabel, owner)
    }
  }
}
