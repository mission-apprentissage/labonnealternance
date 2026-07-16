import { ObjectId } from "mongodb"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import dayjs from "shared/helpers/dayjs"
import { EMAIL_LOG_TYPE } from "shared/models/applicantEmailLog.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import { uploadContactListToBrevo } from "@/services/brevo.service"

import { buildTaggedSearchUrl } from "./relanceSearchUrl"

const RELANCE_SPONTANEE_UTM_CAMPAIGN = "relance-incitation-spontanee"
const TIMEZONE = "Europe/Paris"
// Même déclencheur que la relance des inactifs : 7 jours après la dernière candidature (jour calendaire, heure de Paris).
// Cible disjointe : uniquement les inactifs qui n'ont JAMAIS fait de candidature spontanée (recruteurs_lba).
const INACTIVITY_DAYS = 7

type RelanceSpontaneeRow = {
  email: string
  firstname: string
  lien_recherche: string
  metier: string
}

type CandidateAggregate = {
  _id: ObjectId
  email: string
  firstname: string
  application_url: string | null
  job_searched_by_user: string | null
  job_title: string | null
}

export const relanceIncitationSpontanee = async () => {
  const listId = config.smtp.brevoRelanceSpontaneeListId
  if (!listId) {
    logger.warn("relanceIncitationSpontanee: LBA_BREVO_RELANCE_SPONTANEE_LIST_ID non configuré, job ignoré")
    return
  }

  const startOfTodayParis = dayjs().tz(TIMEZONE).startOf("day")
  const windowStart = startOfTodayParis.subtract(INACTIVITY_DAYS, "day").toDate()
  const windowEnd = startOfTodayParis.subtract(INACTIVITY_DAYS - 1, "day").toDate()

  const candidates = await getDbCollection("applicants")
    .aggregate<CandidateAggregate>([
      { $match: { last_connection: { $gte: windowStart, $lt: windowEnd } } },
      {
        $lookup: {
          from: "applicants_email_logs",
          let: { applicantId: "$_id" },
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$applicant_id", "$$applicantId"] }, { $eq: ["$type", EMAIL_LOG_TYPE.RELANCE_INCITATION_SPONTANEE] }] } } }],
          as: "relance_logs",
        },
      },
      { $match: { relance_logs: { $size: 0 } } },
      // Cible : aucune candidature spontanée (recruteurs_lba). Disjoint de la liste A (relance des inactifs).
      {
        $lookup: {
          from: "applications",
          let: { applicantId: "$_id" },
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$applicant_id", "$$applicantId"] }, { $eq: ["$job_origin", LBA_ITEM_TYPE.RECRUTEURS_LBA] }] } } }, { $limit: 1 }],
          as: "spontaneous_applications",
        },
      },
      { $match: { spontaneous_applications: { $size: 0 } } },
      {
        $lookup: {
          from: "applications",
          let: { applicantId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$applicant_id", "$$applicantId"] } } }, { $sort: { created_at: -1 } }, { $limit: 1 }],
          as: "last_application",
        },
      },
      { $unwind: "$last_application" },
      {
        $project: {
          _id: 1,
          email: 1,
          firstname: 1,
          application_url: "$last_application.application_url",
          job_searched_by_user: "$last_application.job_searched_by_user",
          job_title: "$last_application.job_title",
        },
      },
    ])
    .toArray()

  if (candidates.length === 0) {
    logger.info("relanceIncitationSpontanee: aucun candidat à relancer")
    return
  }

  const rows: RelanceSpontaneeRow[] = candidates.map((candidate) => ({
    email: candidate.email,
    firstname: candidate.firstname,
    // On met en avant les entreprises où candidater spontanément (recruteurs LBA) sur la page de recherche
    lien_recherche: buildTaggedSearchUrl(candidate.application_url, { utmCampaign: RELANCE_SPONTANEE_UTM_CAMPAIGN, highlightRecruteursLba: true }) ?? "",
    metier: candidate.job_searched_by_user ?? candidate.job_title ?? "",
  }))

  // On trace la relance AVANT l'envoi : en cas de crash entre les deux, on préfère rater une relance
  // plutôt que d'en envoyer deux (garantie "une seule relance par candidat et par liste").
  const now = new Date()
  await getDbCollection("applicants_email_logs").insertMany(
    candidates.map((candidate) => ({
      _id: new ObjectId(),
      applicant_id: candidate._id,
      application_id: null,
      type: EMAIL_LOG_TYPE.RELANCE_INCITATION_SPONTANEE,
      message_id: null,
      createdAt: now,
    }))
  )

  try {
    await uploadContactListToBrevo(
      "MARKETING",
      rows,
      [
        { key: "email", header: "EMAIL" },
        { key: "firstname", header: "PRENOM" },
        { key: "lien_recherche", header: "LIEN_RECHERCHE" },
        { key: "metier", header: "METIER" },
      ],
      listId
    )
  } catch (error) {
    await notifyToSlack({
      subject: "RELANCE INCITATION SPONTANEE",
      message: `Échec de l'envoi vers Brevo pour ${rows.length} candidat(s) (déjà tracés, ils ne seront pas relancés)`,
      error: true,
    })
    throw error
  }

  await notifyToSlack({
    subject: "RELANCE INCITATION SPONTANEE",
    message: `${rows.length} candidat(s) poussé(s) vers la liste Brevo d'incitation aux candidatures spontanées`,
    error: false,
  })
  logger.info(`relanceIncitationSpontanee: ${rows.length} candidat(s) relancé(s)`)
}
