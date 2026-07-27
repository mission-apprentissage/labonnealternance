import type { ObjectId } from "mongodb"
import dayjs from "shared/helpers/dayjs"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { UserEventType } from "shared/models/userWithAccount.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import { uploadContactListToBrevo } from "@/services/brevo.service"

const TIMEZONE = "Europe/Paris"
// Relance à l'anniversaire du dépôt de la dernière offre, un mois avant la date pile (330 jours ≈ 11 mois) :
// l'entreprise est contactée juste avant de re-planifier son recrutement d'alternants pour la rentrée suivante.
const NURTURING_DAYS = 330
// Une entreprise n'est relancée qu'une fois par cycle annuel
const NURTURING_CAP_DAYS = 330
// Les déclenchements tombant en août (mois creux) sont reportés au 1er septembre
const AUGUST = 7
const SEPTEMBER = 8
const AUGUST_CATCH_UP_DAYS = 31

type NurturingRow = {
  email: string
  firstname: string
  raison_sociale: string
  metier: string
  date_derniere_offre: Date
}

type NurturingAggregate = {
  offer_id: ObjectId
  offer_title: string | null
  offer_creation: Date
  email: string
  firstname: string
  raison_sociale: string | null
}

export const nurturingEntreprises = async () => {
  const listId = config.smtp.brevoNurturingEntreprisesListId
  if (!listId) {
    logger.warn("nurturingEntreprises: LBA_BREVO_NURTURING_ENTREPRISES_LIST_ID non configuré, job ignoré")
    return
  }

  const today = dayjs().tz(TIMEZONE).startOf("day")
  if (today.month() === AUGUST) {
    logger.info("nurturingEntreprises: mois d'août, relances reportées au 1er septembre")
    return
  }

  let windowStart = today.subtract(NURTURING_DAYS, "day")
  const windowEnd = today.subtract(NURTURING_DAYS, "day").add(1, "day")
  if (today.month() === SEPTEMBER && today.date() === 1) {
    windowStart = windowStart.subtract(AUGUST_CATCH_UP_DAYS, "day")
  }

  const now = new Date()
  const capDate = today.subtract(NURTURING_CAP_DAYS, "day").toDate()

  const companies = await getDbCollection("jobs_partners")
    .aggregate<NurturingAggregate>([
      {
        $match: {
          partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
          managed_by: { $ne: null },
          offer_creation: { $gte: windowStart.toDate(), $lt: windowEnd.toDate() },
          relance_mail_nurturing: null,
        },
      },
      { $sort: { offer_creation: -1 } },
      {
        $group: {
          _id: "$managed_by",
          offer_id: { $first: "$_id" },
          offer_title: { $first: "$offer_title" },
          offer_creation: { $first: "$offer_creation" },
        },
      },
      // Exclut les entreprises encore actives : offre plus récente, offre active en cours, ou nurturing déjà envoyé sur le cycle
      {
        $lookup: {
          from: "jobs_partners",
          let: { managedBy: "$_id", pivotCreation: "$offer_creation" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$managed_by", "$$managedBy"] },
                    {
                      $or: [
                        { $gt: ["$offer_creation", "$$pivotCreation"] },
                        { $and: [{ $eq: ["$offer_status", JOB_STATUS_ENGLISH.ACTIVE] }, { $gt: ["$offer_expiration", now] }] },
                        { $gt: ["$relance_mail_nurturing", capDate] },
                      ],
                    },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "recent_activity",
        },
      },
      { $match: { recent_activity: { $size: 0 } } },
      // Contact : uniquement les comptes ENTREPRISE actifs et autorisés (exclut les CFA et les comptes désactivés/anonymisés)
      {
        $lookup: {
          from: "rolemanagement360",
          let: { managedBy: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user__id", "$$managedBy"] },
                    { $eq: ["$role_authorized_type", AccessEntityType.ENTREPRISE] },
                    { $eq: ["$role_last_status", AccessStatus.GRANTED] },
                    { $eq: ["$user_last_status", UserEventType.ACTIF] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "contact",
        },
      },
      { $unwind: "$contact" },
      {
        $project: {
          _id: 0,
          offer_id: 1,
          offer_title: 1,
          offer_creation: 1,
          email: "$contact.user_email",
          firstname: "$contact.user_first_name",
          raison_sociale: "$contact.entreprise_raison_sociale",
        },
      },
    ])
    .toArray()

  if (companies.length === 0) {
    logger.info("nurturingEntreprises: aucune entreprise à relancer")
    return
  }

  const rows: NurturingRow[] = companies.map((company) => ({
    email: company.email,
    firstname: company.firstname,
    raison_sociale: company.raison_sociale ?? "",
    metier: company.offer_title ?? "",
    date_derniere_offre: company.offer_creation,
  }))

  // On marque l'offre pivot AVANT l'envoi : en cas de crash entre les deux, on préfère rater une relance
  // plutôt que d'en envoyer deux (garantie "une relance par entreprise et par cycle annuel").
  await getDbCollection("jobs_partners").updateMany({ _id: { $in: companies.map((company) => company.offer_id) } }, { $set: { relance_mail_nurturing: now } })

  try {
    await uploadContactListToBrevo(
      "MARKETING",
      rows,
      [
        { key: "email", header: "EMAIL" },
        { key: "firstname", header: "PRENOM" },
        { key: "raison_sociale", header: "RAISON_SOCIALE" },
        { key: "metier", header: "METIER" },
        { key: "date_derniere_offre", header: "DATE_DERNIERE_OFFRE" },
      ],
      listId
    )
  } catch (error) {
    await notifyToSlack({
      subject: "NURTURING ENTREPRISES",
      message: `Échec de l'envoi vers Brevo pour ${rows.length} entreprise(s) (déjà tracées, elles ne seront pas relancées)`,
      error: true,
    })
    throw error
  }

  await notifyToSlack({ subject: "NURTURING ENTREPRISES", message: `${rows.length} entreprise(s) poussée(s) vers la liste Brevo de nurturing`, error: false })
  logger.info(`nurturingEntreprises: ${rows.length} entreprise(s) relancée(s)`)
}
