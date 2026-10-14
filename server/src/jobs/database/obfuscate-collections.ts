import { ObjectId } from "bson"
import { randomUUID } from "crypto"
import { chunk } from "lodash-es"
import type { Document, Filter } from "mongodb"
import { getLastStatusEvent } from "shared"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"
import type { CollectionName } from "shared/models/models"
import { modelDescriptors } from "shared/models/models"
import { AccessEntityType, AccessStatus } from "shared/models/role-management.model"
import { UserEventType } from "shared/models/user-with-account.model"
import { logger } from "@/common/logger"
import { getDatabase, getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { fillSearchItemsCollection } from "../search/generate-search-items-collection"
import { recreateIndexes } from "./recreate-indexes"

const fakeEmail = "faux_email@faux-domaine-compagnie.com"

// Les documents restaurés de production peuvent déroger au schéma : le validateur y est en `warn`, en `error` ailleurs.
const bypassValidation = { bypassDocumentValidation: true }
export const getFakeEmail = () => `${randomUUID()}@faux-domaine.fr`

// leave this function to be used.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// biome-ignore lint/correctness/noUnusedVariables: migration
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
    logger.error(err, "Error reducing collection")
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
  await getDbCollection("applicants").bulkWrite(bulk, bypassValidation)
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
    },
    bypassValidation
  )
}

const obfuscateEmailBlackList = async () => {
  logger.info(`obfuscating email blacklist`)
  const emails = getDbCollection("emailblacklists").find({})
  for await (const ebl of emails) {
    const email = getFakeEmail()
    const replacement = { $set: { email } }
    await getDbCollection("emailblacklists").findOneAndUpdate({ _id: ebl._id }, replacement, bypassValidation)
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
    },
    bypassValidation
  )
}

const obfuscateElligibleTrainingsForAppointment = async () => {
  logger.info(`obfuscating elligible trainings for appointments`)
  await getDbCollection("eligible_trainings_for_appointments").updateMany(
    {},
    {
      $set: { lieu_formation_email: fakeEmail },
    },
    bypassValidation
  )
}

const obfuscateEtablissements = async () => {
  logger.info(`obfuscating etablissements`)
  await getDbCollection("etablissements").updateMany(
    {},
    {
      $set: { gestionnaire_email: fakeEmail },
    },
    bypassValidation
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
    },
    bypassValidation
  )
}

const fakeJobPartner: Partial<IJobsPartnersOfferPrivate> = {
  apply_url: "https://labonnealternance-recette.apprentissage.beta.gouv.fr",
  apply_phone: "0601010106",
  apply_email: fakeEmail,
  cfa_apply_phone: "0601010106",
  cfa_apply_email: fakeEmail,
  offer_description: "offer_description",
  workplace_description: "workplace_description",
}

const obfuscatePartnerJobs = async () => {
  logger.info(`obfuscating jobs_partners`)
  await getDbCollection("jobs_partners").updateMany(
    { partner_label: { $nin: [JOBPARTNERS_LABEL.RECRUTEURS_LBA] } },
    {
      $set: fakeJobPartner,
    },
    bypassValidation
  )
}

const obfuscateJobsPartnersContacts = async () => {
  logger.info(`obfuscating jobs_partners delegations and status history`)
  await getDbCollection("jobs_partners").updateMany({ "delegations.0": { $exists: true } }, { $set: { "delegations.$[].email": fakeEmail } }, bypassValidation)
  await getDbCollection("jobs_partners").updateMany(
    { "offer_status_history.granted_by": { $regex: "@" } },
    { $set: { "offer_status_history.$[event].granted_by": "obfuscation" } },
    { arrayFilters: [{ "event.granted_by": { $regex: "@" } }], ...bypassValidation }
  )
}

const obfuscateRecruteursLba = async () => {
  logger.info(`obfuscating jobs_partners`)
  await getDbCollection("jobs_partners").updateMany(
    { partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, apply_email: { $not: { $eq: null } } },
    {
      $set: {
        apply_email: fakeEmail,
        apply_phone: "0601010807",
      },
    },
    bypassValidation
  )

  await getDbCollection("jobs_partners").updateMany(
    { partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, apply_email: null },
    {
      $set: {
        apply_phone: "0601012020",
      },
    },
    bypassValidation
  )
}

const JOBS_PARTNERS_KEPT_DOCUMENTS = 75_000
const JOBS_PARTNERS_DELETE_CHUNK_SIZE = 1_000

// Le $project précède le $sort : trier les documents complets ferait déborder le tri sur disque
// dès quelques centaines de milliers d'offres. Les suppressions sont séquentielles pour ne pas
// saturer le pool de connexions quand le dépassement se compte en centaines de chunks.
const reduceJobsPartners = async (description: string, match: Filter<IJobsPartnersOfferPrivate>, limit = JOBS_PARTNERS_KEPT_DOCUMENTS) => {
  logger.info(`reducing jobs_partners ${description} to ${limit} latest documents`)
  const result = await getDbCollection("jobs_partners")
    .aggregate<{ _id: ObjectId }>([{ $match: match }, { $project: { _id: 1 } }, { $sort: { _id: -1 } }, { $skip: limit }])
    .toArray()
  const idsToDelete = result.map((val) => val._id)
  for (const ids of chunk(idsToDelete, JOBS_PARTNERS_DELETE_CHUNK_SIZE)) {
    await getDbCollection("jobs_partners").deleteMany({ _id: { $in: ids } })
  }
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
    await getDbCollection("userswithaccounts").findOneAndUpdate({ _id: role.user_id }, replacement, bypassValidation)

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
        },
        bypassValidation
      )
    }
  }
}

const ADMIN_EMAIL = "admin-recette@beta.gouv.fr"

const obfuscateUser = async () => {
  logger.info(`obfuscating users`)
  const users = getDbCollection("users").find({})
  for await (const user of users) {
    const email = getFakeEmail()
    const replacement = { $set: { email, phone: "0601010106", lastname: "nom_famille", firstname: "prenom" } }
    await getDbCollection("users").findOneAndUpdate({ _id: user._id }, replacement, bypassValidation)
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
    await getDbCollection("userswithaccounts").findOneAndUpdate({ _id: user._id }, replacement, bypassValidation)
  }

  logger.info(`obfuscating userswithaccounts done`)

  await keepSpecificUser(ADMIN_EMAIL, AccessEntityType.ADMIN)

  await keepSpecificUser("cfa@beta.gouv.fr", AccessEntityType.CFA)

  await keepSpecificUser("entreprise@beta.gouv.fr", AccessEntityType.ENTREPRISE)

  await keepSpecificUser("opco@beta.gouv.fr", AccessEntityType.OPCO)
}

const obfuscateEntreprisesManagedByCfa = async () => {
  logger.info(`obfuscating entreprise_managed_by_cfa`)
  const entreprises = getDbCollection("entreprise_managed_by_cfa").find({})
  for await (const entreprise of entreprises) {
    await getDbCollection("entreprise_managed_by_cfa").findOneAndUpdate(
      { _id: entreprise._id },
      {
        $set: {
          email: getFakeEmail(),
          phone: "0601010106",
          last_name: "nom_famille",
          first_name: "prenom",
        },
      },
      bypassValidation
    )
  }
}

const jobProcessorCollections = ["job_processor.workers", "job_processor.jobs", "job_processor.signals"]

// Collections que `dropUnknownCollections` doit épargner bien qu'aucun modèle ne les décrive :
// file du job processor et journal des migrations.
export const modelToKeep: string[] = [...jobProcessorCollections, "changelog"]

// Le job processor ne tourne pas en preview mais y est lancé à la main : ses collections doivent exister, vides.
// Le worker et le job du CLI en cours, plus récents que la restauration, sont épargnés : sans eux le heartbeat échoue.
const emptyJobProcessorCollections = async () => {
  const cutoff = new Date(Date.now() - 60_000)
  const filters: Record<string, Filter<Document>> = {
    "job_processor.workers": { lastSeen: { $lt: cutoff } },
    "job_processor.jobs": { created_at: { $lt: cutoff } },
    "job_processor.signals": {},
  }
  await Promise.all(
    jobProcessorCollections.map(async (name) => {
      logger.info(`emptying ${name}`)
      await getDatabase().collection(name).deleteMany(filters[name])
    })
  )
}

const dropUnknownCollections = async () => {
  const knownCollections = new Set<string>([...modelDescriptors.map((d) => d.collectionName), ...modelToKeep])
  const existingCollections = await getDatabase().listCollections().toArray()

  await Promise.all(
    existingCollections
      .filter(({ name }) => !knownCollections.has(name))
      .map(async ({ name }) => {
        logger.info(`dropping unknown collection ${name}`)
        await getDatabase().dropCollection(name)
      })
  )
}

export async function obfuscateCollections(): Promise<void> {
  if (config.env === "production") return

  await dropUnknownCollections()
  await emptyJobProcessorCollections()

  const rawCollections = modelDescriptors.map((d) => d.collectionName).filter((name) => name.startsWith("raw_"))

  const collectionsToEmpty: CollectionName[] = [
    "anonymized_applicants",
    "anonymized_applications",
    "anonymized_appointments",
    "anonymized_users",
    "anonymized_userswithaccounts",
    "apicalls",
    "applicants",
    "applicants_email_logs",
    "applications",
    "appointments",
    "cache_classification",
    "cache_geolocation",
    "cache_siret",
    "computed_jobs_partners",
    "credentials",
    "customemailetfas",
    "emailblacklists",
    "jobs",
    "opcos",
    "recruteurlbaupdateevents",
    "reported_companies",
    "rolemanagement360",
    "search_queries",
    "sessions",
    "trafficsources",
    "unsubscribedofs",
    "unsubscribedrecruteurslba",
    "users",
    ...rawCollections,
  ]

  await Promise.all(
    collectionsToEmpty.map(async (collectionToEmpty) => {
      logger.info(`dropping ${collectionToEmpty}`)
      await getDatabase()
        .dropCollection(collectionToEmpty)
        // biome-ignore lint/suspicious/noEmptyBlockStatements: migration
        .catch(() => {})
    })
  )

  await obfuscateApplicants()
  await obfuscateApplications()
  await reduceJobsPartners("(flux partenaires)", { partner_label: { $nin: jobPartnersExcludedFromFlux } })
  await obfuscatePartnerJobs()
  await reduceJobsPartners("recruteurs_lba", { partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
  await obfuscateRecruteursLba()

  await obfuscateEmailBlackList()
  await obfuscateAppointments()
  await obfuscateElligibleTrainingsForAppointment()
  await obfuscateEtablissements()
  await obfuscateFormations()
  await obfuscateUser()
  await obfuscateUsersWithAccounts()
  await obfuscatePartnerJobs()
  await obfuscateJobsPartnersContacts()
  await obfuscateEntreprisesManagedByCfa()

  await recreateIndexes({ drop: true })

  // Les collections search_* sont calculées sur l'intégralité de jobs_partners : on les réaligne sur l'échantillon conservé.
  await fillSearchItemsCollection()
}
