import { randomUUID } from "crypto"

import { ObjectId } from "bson"
import { chunk } from "lodash-es"
import { getLastStatusEvent } from "shared"
import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
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

const obfuscateApplicantsAndApplications = async () => {
  logger.info(`obfuscating applicants`)
  await getDbCollection("applicants").updateMany(
    {},
    {
      $set: {
        firstname: "prenom",
        lastname: "nom",
        phone: "0601010106",
        email: getFakeEmail(),
      },
    }
  )
  logger.info(`obfuscating applications`)
  await getDbCollection("applications").updateMany(
    {},
    {
      $set: {
        applicant_email: getFakeEmail(),
        applicant_phone: "0601010106",
        applicant_last_name: "nom_famille",
        applicant_first_name: "prenom",
        applicant_attachment_name: "titre_cv.pdf",
        applicant_message_to_company: "Cher recruteur, embauchez moi ...",
        company_feedback: "Cher candidat ...",
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

const obfuscateLbaCompanies = async () => {
  logger.info(`obfuscating lbacompanies`)
  await getDbCollection("recruteurslba").updateMany(
    {},
    {
      $set: {
        email: fakeEmail,
        phone: "0601010106",
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

const fakeJobPartner = {
  apply_phone: "0601010106",
  apply_url: "https://labonnealternance-recette.apprentissage.beta.gouv.fr/faq",
  offer_access_conditions: ["vert", "rouge", "bleu"],
  offer_desired_skills: ["flûte", "violon", "contrebasse"],
  offer_title: "Boucher en Alternance H/F",
  offer_to_be_acquired_skills: ["gentillesse"],
  offer_description:
    "Les missions du poste : Vous avez envie de...\r\n- Connaitre, transformer les produits de votre marché. Vous mettez en oeuvre les découpes et recettes / process de transformation de vos produits. Vous êtes polyvalent à tous les postes de fabrication / découpe avec un haut niveau de professionnalisme. Vous évaluez la qualité et la fraîcheur des produits et d'écarter les produits non-conformes.\r\n- Contribuer à la bonne organisation de la production dans le respect des règles d'hygiène.  Vous organisez votre espace de travail (propreté, rangement, entretien du matériel) et veillez au respect des règles de sécurité alimentaire. Enfin, vous étalez la fabrication afin de garantir la fraîcheur des produits et de répondre à l'objectif de zéro rupture.\r\n- Mettre en valeurs vos produits et fidéliser vos clients. Vous approvisionnez et mettez en avant vos produits, dans le respect des règles d'étalagisme et de merchandising. Vous veillez à la mise en valeur de vos produits, dans le but d'attirer et fidéliser vos clients. Vous conseillez et répondez aux attentes de ces derniers.\r\n\r\nVous êtes...\r\n\r\nEn formation de niveau BP/CAP/Bac Pro en boucherie ou un CQP.",
  workplace_brand: "Adadass",
  workplace_name: "Adadass",
  workplace_legal_name: "Adadass",
  workplace_siret: "11000007200014",
  workplace_website: "https://rhalternance.com/companies/societe",
}

const obfuscatePartnerJobs = async () => {
  logger.info(`obfuscating formations`)
  await getDbCollection("computed_jobs_partners").updateMany(
    {},
    {
      $set: fakeJobPartner,
    }
  )

  await getDbCollection("jobs_partners").updateMany(
    {},
    {
      $set: fakeJobPartner,
    }
  )

  await getDbCollection("raw_rhalternance").deleteMany({})
  await getDbCollection("raw_hellowork").deleteMany({})
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
  if (config.env === "production") {
    // prévention :)
    return
  }

  await getDbCollection("optouts").deleteMany({})
  await getDbCollection("cache_geolocation").deleteMany({})
  await getDbCollection("cache_romeo").deleteMany({})
  await getDbCollection("cache_siret").deleteMany({})
  await getDbCollection("unsubscribedrecruteurslba").deleteMany({})
  await getDbCollection("unsubscribedofs").deleteMany({})
  await getDbCollection("trafficsources").deleteMany({})
  await getDbCollection("sessions").deleteMany({})
  await getDbCollection("rolemanagement360").deleteMany({})
  await getDbCollection("reported_companies").deleteMany({})
  await getDbCollection("recruteurlbaupdateevents").deleteMany({})
  await getDbCollection("jobs").deleteMany({})
  await getDbCollection("eligible_trainings_for_appointments_histories").deleteMany({})
  await getDbCollection("applicants_email_logs").deleteMany({})
  await getDbCollection("anonymized_applicants").deleteMany({})
  await getDbCollection("anonymized_applications").deleteMany({})
  await getDbCollection("anonymized_appointments").deleteMany({})
  await getDbCollection("anonymized_recruiters").deleteMany({})
  await getDbCollection("anonymized_users").deleteMany({})
  await getDbCollection("anonymized_userswithaccounts").deleteMany({})
  await getDbCollection("recruteurslbalegacies").deleteMany({})

  await reduceModel("apicalls", 5)
  await reduceModel("applicants", 50)
  await reduceModel("applications", 500)
  await reduceModel("appointments", 100)
  await reduceModel("emailblacklists", 100)
  await reduceModel("applicants", 10)
  await reduceModel("users", 10)
  await reduceModel("opcos", 5000)

  await obfuscateApplicantsAndApplications()
  await obfuscateEmailBlackList()
  await obfuscateAppointments()
  await obfuscateLbaCompanies()
  await obfuscateElligibleTrainingsForAppointment()
  await obfuscateEtablissements()
  await obfuscateFormations()
  await obfuscateRecruiter()
  await obfuscateUser()
  await obfuscateUsersWithAccounts()
  await obfuscatePartnerJobs()
}
