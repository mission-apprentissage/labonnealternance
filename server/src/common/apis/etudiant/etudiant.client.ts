import axios from "axios"
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

/**
 * API Doc : https://developers.piloty.fr/feeds/feed-jobs
 */
export const getJobEtudiantJobs = async (): Promise<IJobEtudiantJob[]> => {
  const allJobs: IJobEtudiantJob[] = []
  let nextPageToken: string | null | undefined = undefined

  do {
    const url = new URL(config.job_etudiant.url)
    if (nextPageToken) {
      url.searchParams.set("next-page", nextPageToken)
    }

    const response = await axios
      .get(url.toString(), {
        headers: { Authorization: `Bearer ${config.job_etudiant.apiKey}` },
      })
      .catch((err: any) => {
        logger.error({ status: err?.response?.status, data: err?.response?.data, url: url.toString() }, "job-etudiant: erreur API")
        throw err
      })

    const parsed = ZJobEtudiantResponse.safeParse(response.data)
    if (!parsed.success) {
      logger.error({ err: parsed.error.issues, url: url.toString() }, "job-etudiant: erreur de parsing de la réponse")
      throw parsed.error
    }
    allJobs.push(...parsed.data.jobs)
    nextPageToken = parsed.data["next-page"]
  } while (nextPageToken)

  return allJobs
}
