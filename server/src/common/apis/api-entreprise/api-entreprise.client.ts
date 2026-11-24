import { EDiffusibleStatus } from "shared/constants/diffusible-status"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import type { IEtablissementGouvData } from "shared/models/cache-infos-siret.model"
import { ZAdresseV3 } from "shared/models/index"
import { z } from "zod"

import getApiClient from "@/common/apis/client"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"

const client = getApiClient({ timeout: 5000 })

const apiParams = {
  token: config.entreprise.apiKey,
  context: config.entreprise.context,
  recipient: config.entreprise.recipient, // Siret Dinum
  object: config.entreprise.object,
}

const ZEtatAdministratifResponse = z.looseObject({
  data: z.looseObject({
    etat_administratif: z.enum(["A", "F"]),
    date_fermeture: z.number().nullish(),
  }),
})

export type IRateLimitState = {
  remaining: number | null
  resetAt: Date | null
}

export type IEtatAdministratifResult =
  | { kind: "found"; etat: "A" | "F"; dateFermeture: Date | null }
  | { kind: "rate_limited"; retryAfterMs: number }
  /** Aucune réponse exploitable : ne permet pas de conclure à une fermeture. `technical` : panne réseau ou fournisseur, par opposition à un SIRET inconnu ou non diffusible. */
  | { kind: "unknown"; reason: string; technical: boolean }

const NON_TECHNICAL_STATUSES = [404, 422, 451]

const DEFAULT_RETRY_AFTER_MS = 60_000

/** Timeout ou connexion refusée. Une IP bannie ne reçoit plus aucune réponse, pas même un code HTTP. */
export const NO_RESPONSE_REASON = "pas de réponse"

const toNumberOrNull = (value: unknown): number | null => {
  const parsed = Number(value)
  return value === undefined || value === null || value === "" || Number.isNaN(parsed) ? null : parsed
}

/** Headers `RateLimit-*` et `Retry-After` : https://entreprise.api.gouv.fr/developpeurs#respecter-la-volumetrie */
const readRateLimit = (headers: Record<string, unknown> | undefined): IRateLimitState => {
  const reset = toNumberOrNull(headers?.["ratelimit-reset"])
  return { remaining: toNumberOrNull(headers?.["ratelimit-remaining"]), resetAt: reset === null ? null : new Date(reset * 1000) }
}

/**
 * État administratif d'un établissement, lu sans cache. Contrairement à getEtablissementFromGouvSafe, le 429 remonte à
 * l'appelant : l'ignorer expose l'IP à un bannissement de 12 h.
 */
export async function getEtatAdministratifFromGouv(siret: string): Promise<{ result: IEtatAdministratifResult; rateLimit: IRateLimitState }> {
  try {
    const response = await client.get(`${config.entreprise.baseUrl}/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}`, { params: apiParams })
    const rateLimit = readRateLimit(response.headers)
    const parsed = ZEtatAdministratifResponse.safeParse(response.data)
    if (!parsed.success) {
      return { result: { kind: "unknown", reason: "réponse sans état administratif", technical: false }, rateLimit }
    }
    const { etat_administratif, date_fermeture } = parsed.data.data
    return { result: { kind: "found", etat: etat_administratif, dateFermeture: date_fermeture ? new Date(date_fermeture * 1000) : null }, rateLimit }
  } catch (error: any) {
    const status: number | undefined = error?.response?.status
    const rateLimit = readRateLimit(error?.response?.headers)
    if (status === 429) {
      const retryAfterSeconds = toNumberOrNull(error.response.headers?.["retry-after"])
      return { result: { kind: "rate_limited", retryAfterMs: retryAfterSeconds === null ? DEFAULT_RETRY_AFTER_MS : retryAfterSeconds * 1000 }, rateLimit }
    }
    return {
      result: { kind: "unknown", reason: status ? `HTTP ${status}` : NO_RESPONSE_REASON, technical: status === undefined || !NON_TECHNICAL_STATUSES.includes(status) },
      rateLimit,
    }
  }
}

export async function getEtablissementFromGouvSafe(siret: string): Promise<IEtablissementGouvData | BusinessErrorCodes.NON_DIFFUSIBLE | null> {
  try {
    if (config.entreprise.simulateError) {
      throw new Error("API entreprise : simulation d'erreur")
    }
    const { data } = await client.get<IEtablissementGouvData>(`${config.entreprise.baseUrl}/sirene/etablissements/diffusibles/${encodeURIComponent(siret)}`, {
      params: apiParams,
    })
    if (data.data.status_diffusion !== EDiffusibleStatus.DIFFUSIBLE) {
      return BusinessErrorCodes.NON_DIFFUSIBLE
    }
    ZAdresseV3.parse(data.data.adresse)
    return data
  } catch (error: any) {
    const status = error?.response?.status
    if (status === 451) {
      return BusinessErrorCodes.NON_DIFFUSIBLE
    }
    if ([404, 422, 429].includes(status)) {
      return null
    }
    // Erreur dédiée : l'AxiosError porte `config.params.token` (clé d'API en query string), cf. SENSITIVE_KEY_PATTERN.
    sentryCaptureException(new Error(`api-entreprise: échec de récupération de l'établissement (${error.message ?? "erreur inconnue"})`), {
      extra: { siret, status, responseData: error?.response?.data },
    })
    if ([502, 503, 504].includes(status)) {
      return null
    }
    throw error
  }
}
