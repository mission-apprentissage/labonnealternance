import axios, { isAxiosError } from "axios"
import { setupCache } from "axios-cache-interceptor"
import http from "http"
import https from "https"
import { z } from "zod"

import { apiRateLimiter } from "@/common/utils/api-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"

// BAL tient sa cascade sous 4 s (mission-apprentissage/bal#556) : le délai garde une marge pour le réseau.
const BAL_TIMEOUT_MS = 6_000

const getApiClient = (options) =>
  setupCache(
    axios.create({
      timeout: BAL_TIMEOUT_MS,
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
      ...options,
    }),
    {
      ttl: 1000 * 60 * 10,
    }
  )

// Tolère la réponse antérieure à mission-apprentissage/bal#555, sans `status` ni `unavailable_sources`.
const ZBalValidationResponse = z.object({
  is_valid: z.boolean(),
  status: z.enum(["valid", "invalid", "indeterminate"]).optional(),
  on: z.enum(["email", "domain"]).optional(),
  sources: z.array(z.string()).optional(),
  unavailable_sources: z.array(z.string()).optional(),
})

/**
 * `indeterminate` : BAL n'a pas pu interroger un fournisseur. `unavailable` : BAL lui-même n'a pas donné de réponse exploitable.
 */
export type IBalValidationResult =
  | { status: "valid"; on: "email" | "domain" | null; sources: string[] }
  | { status: "invalid" }
  | { status: "indeterminate"; unavailableSources: string[] }
  | { status: "unavailable" }

/**
 * Documentation https://bal.apprentissage.beta.gouv.fr/api/documentation/static/index.html
 */
const executeWithRateLimiting = apiRateLimiter("apiBal", {
  nbRequests: 2,
  durationInSeconds: 1,
  client: getApiClient({
    baseURL: config.bal.baseUrl,
    timeout: BAL_TIMEOUT_MS,
  }),
})

const toResult = (data: z.output<typeof ZBalValidationResponse>): IBalValidationResult => {
  const status = data.status ?? (data.is_valid ? "valid" : "invalid")
  switch (status) {
    case "valid":
      // Les sources de l'ancien format sont en majuscules (`AKTO`, `OPCO_EP`).
      return { status, on: data.on ?? null, sources: [...new Set((data.sources ?? []).map((source) => source.toLowerCase()))] }
    case "indeterminate":
      return { status, unavailableSources: data.unavailable_sources ?? [] }
    case "invalid":
      return { status }
  }
}

function categorizeFailure(error: unknown): { outcome: string; httpStatus?: number } {
  if (!isAxiosError(error)) {
    return { outcome: "unexpected" }
  }
  const httpStatus = error.response?.status
  if (httpStatus !== undefined) {
    return { outcome: httpStatus >= 500 ? "http_5xx" : "http_4xx", httpStatus }
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return { outcome: "timeout" }
  }
  return { outcome: "network" }
}

// L'erreur axios brute porte le corps de la requête (e-mail, SIRET) : seule une erreur sans donnée part vers Sentry.
const reportUnavailable = (outcome: string, details: { httpStatus?: number | undefined; durationMs: number }) => {
  const context = { provider: "bal", outcome, duration_ms: details.durationMs, ...(details.httpStatus !== undefined ? { http_status: details.httpStatus } : {}) }
  sentryCaptureException(new Error(`BAL : validation d'organisation indisponible (${outcome})`), {
    tags: { module: "validation", provider: "bal", outcome },
    contexts: { validation: context },
    fingerprint: ["validation", "bal", outcome],
  })
}

/**
 * @description Validation d'appartenance à une organisation
 */
export const validationOrganisation = async (siret: string, email: string): Promise<IBalValidationResult> => {
  const startedAt = Date.now()
  try {
    const data = await executeWithRateLimiting(async (client) => {
      const response = await client.post(`/organisation/validation`, { email, siret }, { headers: { Authorization: `Bearer ${config.bal.apiKey}` } })
      return response.data
    })
    const parsed = ZBalValidationResponse.safeParse(data)
    if (!parsed.success) {
      reportUnavailable("unexpected", { durationMs: Date.now() - startedAt })
      return { status: "unavailable" }
    }
    return toResult(parsed.data)
  } catch (error) {
    const { outcome, httpStatus } = categorizeFailure(error)
    reportUnavailable(outcome, { httpStatus, durationMs: Date.now() - startedAt })
    return { status: "unavailable" }
  }
}
