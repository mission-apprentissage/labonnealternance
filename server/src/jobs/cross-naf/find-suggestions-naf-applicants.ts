import type { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import dayjs from "shared/helpers/dayjs"
import { EMAIL_LOG_TYPE } from "shared/models/applicant-email-log.model"
import type { IApplication } from "shared/models/applications.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

const TIMEZONE = "Europe/Paris"
export const MAX_APPLICATIONS = 3

// Une candidature partenaire n'est enregistrée chez nous que si elle passe par notre formulaire (smart apply).
// Les candidatures spontanées (recruteurs_lba) portent sur des offres multi-ROME, d'où leur exclusion (RG 5).
export const SUGGESTION_SOURCE_JOB_ORIGINS = [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]

export type SuggestionsNafWindow = { from: Date; to: Date }

export type SuggestionsNafApplicant = {
  _id: ObjectId
  email: string
  firstname: string
  applications: Pick<IApplication, "_id" | "job_id" | "job_origin" | "created_at">[]
}

export const getPreviousDayWindow = (now = new Date()): SuggestionsNafWindow => {
  const startOfToday = dayjs(now).tz(TIMEZONE).startOf("day")
  // Reparsé dans le fuseau : `subtract` garde l'offset du jour courant et décale la veille d'1 h au changement d'heure.
  const startOfYesterday = dayjs.tz(startOfToday.subtract(1, "day").format("YYYY-MM-DD"), TIMEZONE)
  return { from: startOfYesterday.toDate(), to: startOfToday.toDate() }
}

export const getLast24hWindow = (now = new Date()): SuggestionsNafWindow => ({ from: dayjs(now).subtract(24, "hour").toDate(), to: now })

/**
 * Candidats créés dans la fenêtre, c'est-à-dire à leur 1re candidature (cf. getOrCreateApplicant, RG 3), qui ont fait
 * au plus 3 candidatures (RG 9), dont au moins une sur une offre LBA ou partenaire (RG 5), et qui n'ont jamais reçu
 * l'email de suggestions. Le plafond porte sur toutes leurs candidatures, y compris celles postérieures à la fenêtre.
 */
export const findSuggestionsNafApplicants = async ({ from, to }: SuggestionsNafWindow): Promise<SuggestionsNafApplicant[]> =>
  getDbCollection("applicants")
    .aggregate<SuggestionsNafApplicant>([
      { $match: { createdAt: { $gte: from, $lt: to } } },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "applicant_id",
          pipeline: [{ $sort: { created_at: 1 } }, { $project: { _id: 1, job_id: 1, job_origin: 1, created_at: 1 } }],
          as: "applications",
        },
      },
      {
        $match: {
          [`applications.${MAX_APPLICATIONS}`]: { $exists: false },
          applications: { $elemMatch: { job_origin: { $in: SUGGESTION_SOURCE_JOB_ORIGINS } } },
        },
      },
      {
        $lookup: {
          from: "applicants_email_logs",
          localField: "_id",
          foreignField: "applicant_id",
          pipeline: [{ $match: { type: EMAIL_LOG_TYPE.SUGGESTIONS_NAF } }, { $limit: 1 }],
          as: "suggestions_logs",
        },
      },
      { $match: { suggestions_logs: { $size: 0 } } },
      { $project: { _id: 1, email: 1, firstname: 1, applications: 1 } },
    ])
    .toArray()
