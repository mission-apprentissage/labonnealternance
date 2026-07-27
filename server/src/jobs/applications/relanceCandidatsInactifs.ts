import { ObjectId } from "mongodb"
import dayjs from "shared/helpers/dayjs"
import { EMAIL_LOG_TYPE } from "shared/models/applicantEmailLog.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import { uploadContactListToBrevo } from "@/services/brevo.service"

const RELANCE_INACTIVITE_UTM_CAMPAIGN = "relance-candidat-inactif"
const TIMEZONE = "Europe/Paris"
// Relance 7 jours après la dernière candidature. La fenêtre cible le jour calendaire d'il y a 7 jours (heure de Paris) :
// comme le cron tourne chaque jour, chaque candidat n'est ciblé qu'une seule fois.
const INACTIVITY_DAYS = 7

type RelanceCandidatRow = {
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

export const buildRelanceSearchUrl = (application_url: string | null | undefined): string | null => {
  if (!application_url) {
    return null
  }
  let url: URL
  try {
    url = new URL(application_url)
  } catch {
    return null
  }
  if (url.pathname.startsWith("/emploi/")) {
    url.pathname = "/recherche"
  }
  // On ne garde que les recherches réellement exploitables (au moins un métier)
  if (!url.searchParams.get("romes") && !url.searchParams.get("rncp")) {
    return null
  }
  // On retire tous les UTM éventuellement capturés dans l'URL d'origine avant de poser les nôtres
  for (const utmParam of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    url.searchParams.delete(utmParam)
  }
  url.searchParams.set("utm_source", "lba-brevo")
  url.searchParams.set("utm_medium", "email")
  url.searchParams.set("utm_campaign", RELANCE_INACTIVITE_UTM_CAMPAIGN)
  return url.toString()
}

export const relanceCandidatsInactifs = async () => {
  const listId = config.smtp.brevoRelanceCandidatsListId
  if (!listId) {
    logger.warn("relanceCandidatsInactifs: LBA_BREVO_RELANCE_CANDIDATS_LIST_ID non configuré, job ignoré")
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
          pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$applicant_id", "$$applicantId"] }, { $eq: ["$type", EMAIL_LOG_TYPE.RELANCE_INACTIVITE] }] } } }],
          as: "relance_logs",
        },
      },
      { $match: { relance_logs: { $size: 0 } } },
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
    logger.info("relanceCandidatsInactifs: aucun candidat à relancer")
    return
  }

  const rows: RelanceCandidatRow[] = candidates.map((candidate) => ({
    email: candidate.email,
    firstname: candidate.firstname,
    lien_recherche: buildRelanceSearchUrl(candidate.application_url) ?? "",
    metier: candidate.job_searched_by_user ?? candidate.job_title ?? "",
  }))

  // On trace la relance AVANT l'envoi : en cas de crash entre les deux, on préfère rater une relance
  // plutôt que d'en envoyer deux (garantie "une seule relance par candidat").
  const now = new Date()
  await getDbCollection("applicants_email_logs").insertMany(
    candidates.map((candidate) => ({
      _id: new ObjectId(),
      applicant_id: candidate._id,
      application_id: null,
      type: EMAIL_LOG_TYPE.RELANCE_INACTIVITE,
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
      subject: "RELANCE CANDIDATS INACTIFS",
      message: `Échec de l'envoi vers Brevo pour ${rows.length} candidat(s) (déjà tracés, ils ne seront pas relancés)`,
      error: true,
    })
    throw error
  }

  await notifyToSlack({ subject: "RELANCE CANDIDATS INACTIFS", message: `${rows.length} candidat(s) poussé(s) vers la liste Brevo de relance`, error: false })
  logger.info(`relanceCandidatsInactifs: ${rows.length} candidat(s) relancé(s)`)
}
