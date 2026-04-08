import axios, { type AxiosResponse } from "axios"
import z from "zod"

import { logger } from "@/common/logger"
import config from "@/config"

const ZTranslation = z.object({
  fr: z.string(),
  en: z.string(),
})

const ZEnumValue = z.object({
  public_id: z.string(),
  translation: ZTranslation,
})

const ZLocation = z.object({
  address_nbr: z.string().nullish().default(null),
  address: z.string().nullable(),
  city: z.string().nullable(),
  administrative_area_department: z.string().nullable(),
  administrative_area_region: z.string().nullable(),
  country: z.string().nullable(),
  country_code: z.string().nullable(),
})

const ZDescription = z.object({
  company_desc: z.string().nullable().default(""),
  job_desc: z.string().nullable().default(""),
  profile_desc: z.string().nullable().default(""),
  benefit_desc: z.string().nullable().default(""),
  process_desc: z.string().nullable().default(""),
})

const ZCompany = z.object({
  public_id: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
})

export const ZJobEtudiantJob = z.object({
  public_id: z.string(),
  name: z.string(),
  company: ZCompany,
  worktime: ZEnumValue.nullable(),
  remote: ZEnumValue.nullable(),
  education: ZEnumValue.nullable(),
  experience: ZEnumValue.nullable(),
  contract: ZEnumValue.nullable(),
  location: ZLocation,
  salary: z.string().nullable(),
  description: ZDescription,
  job_url: z.string().nullable(),
  apply_url: z.string().nullable(),
  publishedAt: z.string(),
})

export type IJobEtudiantJob = z.output<typeof ZJobEtudiantJob>

const ZJobEtudiantResponse = z.object({
  "next-page": z.string().nullable().optional(),
  jobs: z.array(ZJobEtudiantJob),
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const RATE_LIMIT_REMAINING_THRESHOLD = 2
const MAX_RETRIES = 3

/**
 * API Doc : https://developers.piloty.fr/feeds/feed-jobs
 */
export const getJobEtudiantJobs = async (): Promise<IJobEtudiantJob[]> => {
  const allJobs: IJobEtudiantJob[] = []
  let nextPageToken: string | null | undefined = undefined

  do {
    const url = new URL(config.job_etudiant.url)
    if (nextPageToken) {
      url.searchParams.set("next-page", decodeURIComponent(nextPageToken))
    }

    let response!: AxiosResponse
    let attempt = 0

    while (true) {
      try {
        response = await axios.get(url.toString(), {
          headers: { Authorization: `Bearer ${config.job_etudiant.apiKey}` },
        })
        break
      } catch (err: any) {
        const status = err?.response?.status
        const headers = err?.response?.headers ?? {}

        if (status === 429 && attempt < MAX_RETRIES) {
          const retryAfter = parseFloat(headers["retry-after"] ?? headers["retry-after-short"] ?? "1")
          const waitMs = Math.ceil(retryAfter) * 1000
          logger.warn({ attempt, waitMs, url: url.toString() }, "job-etudiant: rate limit 429, attente avant retry")
          await sleep(waitMs)
          attempt++
          continue
        }

        const data = err?.response?.data
        logger.error({ status, data, url: url.toString() }, "job-etudiant: erreur API")
        throw new Error(`job-etudiant: API error ${status} - ${JSON.stringify(data)}`)
      }
    }

    // Throttling proactif : si le quota restant est bas, on attend le reset
    const remaining = parseInt(response.headers["x-ratelimit-remaining"] ?? response.headers["x-ratelimit-remaining-short"] ?? "99", 10)
    const resetIn = parseFloat(response.headers["x-ratelimit-reset"] ?? response.headers["x-ratelimit-reset-short"] ?? "0")
    if (!isNaN(remaining) && remaining <= RATE_LIMIT_REMAINING_THRESHOLD && resetIn > 0) {
      const waitMs = Math.ceil(resetIn) * 1000
      logger.info({ remaining, waitMs, url: url.toString() }, "job-etudiant: quota bas, pause avant prochaine requête")
      await sleep(waitMs)
    }

    const parsed = ZJobEtudiantResponse.safeParse(response!.data)
    if (!parsed.success) {
      logger.error({ err: parsed.error.issues, url: url.toString() }, "job-etudiant: erreur de parsing de la réponse")
      throw parsed.error
    }
    allJobs.push(...parsed.data.jobs)
    nextPageToken = parsed.data["next-page"]
  } while (nextPageToken)

  return allJobs
}
