import type { IModerationQueueFilters } from "shared/routes/jobs-partners-moderation.routes"
import { ZModerationQueueFilters } from "shared/routes/jobs-partners-moderation.routes"
import { z } from "zod"

import type { IModerationUserType } from "./moderation.types"

export type IModerationQueueState = IModerationQueueFilters & { offset: number }

const ZModerationQueueState = ZModerationQueueFilters.extend({ offset: z.number().int().min(0) })

/**
 * Filtres, tri et page de la file, relus par la page de détail pour la navigation entre offres et au retour à la liste.
 * En sessionStorage et non dans l'URL : la recherche peut être l'e-mail du recruteur (cf. PERSONAL_QUERY_PARAMS côté serveur).
 */
const storageKey = (userType: IModerationUserType) => `lba:moderation-queue:${userType}`

export const readModerationQueueState = (userType: IModerationUserType): IModerationQueueState | null => {
  try {
    const raw = window.sessionStorage.getItem(storageKey(userType))
    if (!raw) return null
    const parsed = ZModerationQueueState.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export const writeModerationQueueState = (userType: IModerationUserType, state: IModerationQueueState) => {
  try {
    window.sessionStorage.setItem(storageKey(userType), JSON.stringify(state))
  } catch {
    // Stockage indisponible (navigation privée, quota) : la navigation suit alors l'ordre par défaut de la file.
  }
}

/** Querystring de l'API : un filtre vide ne restreint pas la file. */
export const toModerationQueueQuery = ({ conformity, account_status, account_type, opco, search, sort, order }: IModerationQueueFilters): IModerationQueueFilters => ({
  conformity: conformity?.length ? conformity : undefined,
  account_status: account_status?.length ? account_status : undefined,
  account_type: account_type?.length ? account_type : undefined,
  opco: opco?.length ? opco : undefined,
  search: search || undefined,
  sort,
  order,
})

/** Page relue au retour sur la file, vidée depuis par des décisions : dernière page non vide, ou null si rien à corriger. */
export const getEmptyPageFallbackOffset = ({ jobsCount, total, offset, pageSize }: { jobsCount: number; total: number; offset: number; pageSize: number }): number | null => {
  if (jobsCount > 0 || offset === 0) return null
  return Math.max(0, Math.ceil(total / pageSize) - 1) * pageSize
}
