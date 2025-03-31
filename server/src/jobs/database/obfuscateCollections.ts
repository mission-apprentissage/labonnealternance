import { randomUUID } from "crypto"

import { ObjectId } from "bson"
import { chunk } from "lodash-es"
import { getLastStatusEvent } from "shared"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { CollectionName } from "shared/models/models"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { UserEventType } from "shared/models/userWithAccount.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"

const fakeEmail = "faux_email@faux-domaine-compagnie.com"
export const getFakeEmail = () => `${randomUUID()}@faux-domaine.fr`

async function reduceModel(model: CollectionName, limit = 20000) {
  logger.info(`reducing collection ${model} to ${limit} latest documents`)
  try {
    const aggregationPipeline = [{ $match: {} }, { $sort: { _id: -1 } }, { $skip: limit }, { $project: { _id: 1 } }]

    const result = await getDbCollection(model).aggregate(aggregationPipeline).toArray()
    const idsToDelete = result.flatMap((val) => val._id)
    const chunks = chunk(idsToDelete, 1_000)

    if (result.length) {
      await Promise.all(chunks.map(async (chunk) => await getDbCollection(model).deleteMany({ _id: { $in: chunk } })))
    }
  } catch (err) {
    logger.error("Error reducing collection", err)
  }
}

const obfuscateApplicants = async () => {
  logger.info(`obfuscating applicants`)
  const applicants = await getDbCollection("applicants").find({}).toArray()
  if (!applicants.length) return
  const bulk = applicants.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { email: getFakeEmail(), firstname: "prenom", lastname: "lastname", phone: "0601010106" } },
    },
  }))
  await getDbCollection("applicants").bulkWrite(bulk)
}

const obfuscateApplications = async () => {
  logger.info(`obfuscating applications`)
  await getDbCollection("applications").updateMany(
    {},
    {
      $set: {
        applicant_attachment_name: "titre_cv.pdf",
        applicant_message_to_company: "applicant_message_to_company",
        company_feedback: "company_feedback",
        company_email: fakeEmail,
        applicant_id: new ObjectId(),
      },
    }
  )
}

const obfuscateEmailBlackList = async () => {
  logger.info(`obfuscating email blacklist`)
  const emails = getDbCollection("emailblacklists").find({})
  for await (const ebl of emails) {
    const email = getFakeEmail()
    const replacement = { $set: { email } }
    await getDbCollection("emailblacklists").findOneAndUpdate({ _id: ebl._id }, replacement)
  }
}

const obfuscateAppointments = async () => {
  logger.info(`obfuscating appointments`)
  await getDbCollection("appointments").updateMany(
    {},
    {
      $set: {
        cfa_message_to_applicant: "Réponse du cfa ...",
        applicant_message_to_cfa: "Message du candidat ...",
        cfa_recipient_email: fakeEmail,
      },
    }
  )
}

const obfuscateElligibleTrainingsForAppointment = async () => {
  logger.info(`obfuscating elligible trainings for appointments`)
  await getDbCollection("eligible_trainings_for_appointments").updateMany(
    {},
    {
      $set: { lieu_formation_email: fakeEmail },
    }
  )
  await getDbCollection("eligible_trainings_for_appointments_histories").updateMany(
    {},
    {
      $set: { lieu_formation_email: fakeEmail },
    },
    {
      bypassDocumentValidation: true,
    }
  )
}

const obfuscateEtablissements = async () => {
  logger.info(`obfuscating etablissements`)
  await getDbCollection("etablissements").updateMany(
    {},
    {
      $set: { gestionnaire_email: fakeEmail },
    }
  )
}

const obfuscateFormations = async () => {
  logger.info(`obfuscating formations`)
  await getDbCollection("formationcatalogues").updateMany(
    {},
    {
      $set: {
        email: fakeEmail,
        etablissement_gestionnaire_courriel: fakeEmail,
        etablissement_formateur_courriel: fakeEmail,
        num_tel: "0601010106",
      },
    }
  )
}

const fakeJobPartner: Partial<IJobsPartnersOfferPrivate> = {
  apply_url: "https://labonnealternance-recette.apprentissage.beta.gouv.fr",
  apply_phone: "0601010106",
  apply_email: fakeEmail,
  offer_description: "offer_description",
  workplace_description: "workplace_description",
}

const obfuscatePartnerJobs = async () => {
  logger.info(`obfuscating jobs_partners`)
  await getDbCollection("jobs_partners").updateMany(
    {},
    {
      $set: fakeJobPartner,
    }
  )
}

const keepSpecificUser = async (email: string, type: AccessEntityType) => {
  const role = await getDbCollection("rolemanagements").findOne({ authorized_type: type })
  const replacement = {
    $set: { email },
    $push: {
      status: {
        $each: [
          { granted_by: "server", date: new Date(), reason: "obfuscation", status: UserEventType.VALIDATION_EMAIL, validation_type: VALIDATION_UTILISATEUR.AUTO },
          { granted_by: "server", date: new Date(), reason: "obfuscation", status: UserEventType.ACTIF, validation_type: VALIDATION_UTILISATEUR.AUTO },
        ],
      },
    },
  }
  if (role) {
    await getDbCollection("userswithaccounts").findOneAndUpdate({ _id: role.user_id }, replacement)

    if (getLastStatusEvent(role.status)?.status !== AccessStatus.GRANTED) {
      await getDbCollection("rolemanagements").findOneAndUpdate(
        { _id: role._id },
        {
          $push: {
            status: {
              granted_by: "server",
              date: new Date(),
              reason: "Obfuscation",
              validation_type: VALIDATION_UTILISATEUR.AUTO,
              status: AccessStatus.GRANTED,
            },
          },
        }
      )
    }
  }
}

const ADMIN_EMAIL = "admin-recette@beta.gouv.fr"
const obfuscateRecruiter = async () => {
  logger.info(`obfuscating recruiters`)

  const remainingUsers = getDbCollection("recruiters").find({ first_name: { $ne: "prenom" } })
  for await (const user of remainingUsers) {
    const replacement = { $set: { email: getFakeEmail(), phone: "0601010106", last_name: "nom_famille", first_name: "prenom" } }
    getDbCollection("recruiters").findOneAndUpdate({ _id: user._id }, replacement, { bypassDocumentValidation: true })
  }

  const recruitersWithDelegations = getDbCollection("recruiters").find({ "jobs.delegations.0": { $exists: true } })

  for await (const recruiter of recruitersWithDelegations) {
    let shouldSave = false
    if (recruiter.jobs) {
      recruiter.jobs.forEach((job) => {
        if (job.delegations) {
          shouldSave = true
          job.delegations.forEach((delegation) => {
            delegation.email = fakeEmail
          })
        }
      })
    }
    if (shouldSave) {
      await getDbCollection("recruiters").updateOne({ _id: recruiter._id }, { $set: { ...recruiter, updatedAt: new Date() } }, { bypassDocumentValidation: true })
    }
  }

  logger.info(`obfuscating recruiters done`)
}

const obfuscateUser = async () => {
  logger.info(`obfuscating users`)
  const users = getDbCollection("users").find({})
  for await (const user of users) {
    const email = getFakeEmail()
    const replacement = { $set: { email, phone: "0601010106", lastname: "nom_famille", firstname: "prenom" } }
    await getDbCollection("users").findOneAndUpdate({ _id: user._id }, replacement)
  }

  logger.info(`obfuscating users done`)
}

const obfuscateUsersWithAccounts = async () => {
  logger.info(`obfuscating userswithaccounts`)
  const users = getDbCollection("userswithaccounts").find({})
  for await (const user of users) {
    const email = getFakeEmail()
    const replacement = {
      $set: { email, phone: "0601010106", last_name: "nom_famille", first_name: "prenom" },
    }
    await getDbCollection("userswithaccounts").findOneAndUpdate({ _id: user._id }, replacement)
  }

  logger.info(`obfuscating userswithaccounts done`)

  // restoring one admin
  await keepSpecificUser(ADMIN_EMAIL, AccessEntityType.ADMIN)

  // restoring one CFA user
  await keepSpecificUser("cfa@beta.gouv.fr", AccessEntityType.CFA)

  // restoring one ENTREPRISE user
  await keepSpecificUser("entreprise@beta.gouv.fr", AccessEntityType.ENTREPRISE)

  // restoring one OPCO user
  await keepSpecificUser("opco@beta.gouv.fr", AccessEntityType.OPCO)
}

export async function obfuscateCollections(): Promise<void> {
  if (config.env === "production") return

  const collectionsToEmpty: CollectionName[] = [
    "cache_geolocation",
    "cache_romeo",
    "cache_siret",
    "unsubscribedrecruteurslba",
    "unsubscribedofs",
    "trafficsources",
    "sessions",
    "rolemanagement360",
    "reported_companies",
    "recruteurlbaupdateevents",
    "jobs",
    "eligible_trainings_for_appointments_histories",
    "applicants_email_logs",
    "recruteurslbalegacies",
    "anonymized_applicants",
    "anonymized_applications",
    "anonymized_appointments",
    "anonymized_recruiters",
    "anonymized_users",
    "anonymized_userswithaccounts",
    "raw_francetravail",
    "raw_pass",
    "raw_hellowork",
    "raw_kelio",
    "raw_rhalternance",
    "computed_jobs_partners",
  ]

  await Promise.all(
    collectionsToEmpty.map(async (collectionToEmpty) => {
      logger.info(`flusing ${collectionToEmpty}`)
      getDbCollection(collectionToEmpty).deleteMany({})
    })
  )

  await reduceModel("apicalls", 5)
  await reduceModel("applicants", 50)
  await reduceModel("applications", 500)
  await reduceModel("appointments", 100)
  await reduceModel("emailblacklists", 100)
  await reduceModel("applicants", 10)
  await reduceModel("users", 10)
  await reduceModel("opcos", 5000)

  await obfuscateApplicants()
  await obfuscateApplications()
  await obfuscatePartnerJobs()
  await obfuscateEmailBlackList()
  await obfuscateAppointments()
  await obfuscateElligibleTrainingsForAppointment()
  await obfuscateEtablissements()
  await obfuscateFormations()
  await obfuscateRecruiter()
  await obfuscateUser()
  await obfuscateUsersWithAccounts()
  await obfuscatePartnerJobs()
}
