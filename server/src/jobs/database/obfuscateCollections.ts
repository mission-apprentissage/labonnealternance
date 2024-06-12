import { randomUUID } from "crypto"

import { getLastStatusEvent, IEmailBlacklist, IUser, IUserRecruteur } from "shared"
import { AUTHTYPE, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { UserEventType } from "shared/models/userWithAccount.model"

import { logger } from "@/common/logger"
import {
  Application,
  Appointment,
  EligibleTrainingsForAppointment,
  eligibleTrainingsForAppointmentHistory,
  Etablissement,
  FormationCatalogue,
  Optout,
  Recruiter,
  RoleManagement,
} from "@/common/model/index"
import { db } from "@/common/mongodb"
import config from "@/config"

import { getDbCollection } from "../../common/utils/mongodbUtils"

const fakeEmail = "faux_email@faux-domaine-compagnie.com"

async function reduceModel(model: string, limit = 20000) {
  logger.info(`reducing collection ${model} to ${limit} latest documents`)
  try {
    const aggregationPipeline = [{ $match: {} }, { $sort: { created_at: -1 } }, { $skip: limit }, { $limit: 1 }, { $project: { _id: 0, minDate: "$created_at" } }]

    const result = await db.collection(model).aggregate(aggregationPipeline)

    if (result.length) {
      await db.collection(model).deleteMany({ created_at: { $lt: result[0].minDate } })
    }
  } catch (err) {
    logger.error("Error reducing collection", err)
  }
}

const obfuscateApplications = async () => {
  logger.info(`obfuscating applications`)
  await Application.updateMany(
    {},
    {
      applicant_email: "faux_email@faux-domaine.fr",
      applicant_phone: "0601010106",
      applicant_last_name: "nom_famille",
      applicant_first_name: "prenom",
      applicant_attachment_name: "titre_cv.pdf",
      applicant_message_to_company: "Cher recruteur, embauchez moi ...",
      company_feedback: "Cher candidat ...",
      company_email: fakeEmail,
    }
  )
}

const obfuscateEmailBlackList = async () => {
  logger.info(`obfuscating email blacklist`)
  const emails: AsyncIterable<IEmailBlacklist> = await db.collection("emailblacklists").find({})
  for await (const ebl of emails) {
    const email = getFakeEmail()
    const replacement = { $set: { email } }
    await db.collection("emailblacklists").findOneAndUpdate({ _id: ebl._id }, replacement)
  }
  logger.info(`obfuscating email blacklist done`)
}

const obfuscateAppointments = async () => {
  logger.info(`obfuscating appointments`)
  await Appointment.updateMany(
    {},
    {
      cfa_message_to_applicant: "Réponse du cfa ...",
      applicant_message_to_cfa: "Message du candidat ...",
      cfa_recipient_email: fakeEmail,
    }
  )
}

const obfuscateLbaCompanies = async () => {
  logger.info(`obfuscating lbacompanies`)
  await getDbCollection("bonnesboites").updateMany(
    {},
    {
      email: fakeEmail,
      phone: "0601010106",
    }
  )
}

const obfuscateElligibleTrainingsForAppointment = async () => {
  logger.info(`obfuscating elligible trainings for appointments`)
  await EligibleTrainingsForAppointment.updateMany(
    {},
    {
      lieu_formation_email: fakeEmail,
    }
  )
  await eligibleTrainingsForAppointmentHistory.updateMany(
    {},
    {
      lieu_formation_email: fakeEmail,
    }
  )
}

const obfuscateEtablissements = async () => {
  logger.info(`obfuscating etablissements`)
  await Etablissement.updateMany(
    {},
    {
      gestionnaire_email: fakeEmail,
    }
  )
}

const obfuscateFormations = async () => {
  logger.info(`obfuscating formations`)
  await FormationCatalogue.updateMany(
    {},
    {
      email: fakeEmail,
      etablissement_gestionnaire_courriel: fakeEmail,
      etablissement_formateur_courriel: fakeEmail,
      num_tel: "0601010106",
    }
  )
}

const getFakeEmail = () => `${randomUUID()}@faux-domaine.fr`

const keepSpecificUser = async (email: string, type: AccessEntityType) => {
  const role = await RoleManagement.findOne({ authorized_type: type }).lean()
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
    await db.collection("userswithaccounts").findOneAndUpdate({ _id: role.user_id }, replacement)

    if (getLastStatusEvent(role.status)?.status !== AccessStatus.GRANTED) {
      await RoleManagement.findOneAndUpdate(
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

  const users: AsyncIterable<IUserRecruteur> = db.collection("userrecruteurs").find({})
  for await (const user of users) {
    const replacement = { $set: { email: getFakeEmail(), phone: "0601010106", last_name: "nom_famille", first_name: "prenom" } }

    switch (user.type) {
      case AUTHTYPE.ENTREPRISE: {
        await Promise.all([
          db.collection("userrecruteurs").findOneAndUpdate({ _id: user._id }, replacement),
          db.collection("recruiters").findOneAndUpdate({ establishment_id: user.establishment_id }, replacement),
        ])
        break
      }
      case AUTHTYPE.CFA: {
        await Promise.all([
          db.collection("userrecruteurs").findOneAndUpdate({ _id: user._id }, replacement),
          db.collection("recruiters").updateMany({ cfa_delegated_siret: user.establishment_siret }, replacement),
        ])
        break
      }

      default: {
        await db.collection("userrecruteurs").findOneAndUpdate({ _id: user._id }, replacement)
        break
      }
    }
  }

  const remainingUsers: AsyncIterable<IUserRecruteur> = db.collection("recruiters").find({ first_name: { $ne: "prenom" } })
  for await (const user of remainingUsers) {
    const replacement = { $set: { email: getFakeEmail(), phone: "0601010106", last_name: "nom_famille", first_name: "prenom" } }
    db.collection("recruiters").findOneAndUpdate({ _id: user._id }, replacement)
  }

  const recruitersWithDelegations = Recruiter.find({ "jobs.delegations.0": { $exists: true } })
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
      await Recruiter.updateOne({ _id: recruiter._id }, { $set: { ...recruiter } })
    }
  }

  logger.info(`obfuscating recruiters done`)
}

const obfuscateUser = async () => {
  logger.info(`obfuscating users`)
  const users: AsyncIterable<IUser> = await db.collection("users").find({})
  for await (const user of users) {
    const email = getFakeEmail()
    const replacement = { $set: { email, phone: "0601010106", lastname: "nom_famille", firstname: "prenom" } }
    await db.collection("users").findOneAndUpdate({ _id: user._id }, replacement)
  }

  logger.info(`obfuscating users done`)
}

const obfuscateUsersWithAccounts = async () => {
  logger.info(`obfuscating userswithaccounts`)
  const users: AsyncIterable<IUser> = await db.collection("userswithaccounts").find({})
  for await (const user of users) {
    const email = getFakeEmail()
    const replacement = {
      $set: { email, phone: "0601010106", last_name: "nom_famille", first_name: "prenom" },
    }
    await db.collection("userswithaccounts").findOneAndUpdate({ _id: user._id }, replacement)
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
  await reduceModel("apicalls", 20000)
  await reduceModel("applications", 50000)
  await reduceModel("anonymizedapplications", 5000)
  await reduceModel("appointments", 10000)
  await reduceModel("emailblacklists", 100)
  await obfuscateApplications()
  await obfuscateEmailBlackList()
  await obfuscateAppointments()
  await obfuscateLbaCompanies()
  await obfuscateElligibleTrainingsForAppointment()
  await obfuscateEtablissements()
  await obfuscateFormations()
  await obfuscateRecruiter()
  await obfuscateUser()
  await obfuscateUsersWithAccounts()
  await Optout.deleteMany({})
}
