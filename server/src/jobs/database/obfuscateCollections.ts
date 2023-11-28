import { randomUUID } from "crypto"

import { faker } from "@faker-js/faker"
import { Model } from "mongoose"
import { IUserRecruteur } from "shared"
import { CFA, ENTREPRISE } from "shared/constants/recruteur"

import { logger } from "@/common/logger"
import {
  AnonymizedApplication,
  ApiCalls,
  Application,
  Appointment,
  EligibleTrainingsForAppointment,
  Etablissement,
  FormationCatalogue,
  LbaCompany,
  UnsubscribedLbaCompany,
} from "@/common/model/index"
import { Pagination } from "@/common/model/schema/_shared/mongoose-paginate"
import { IUser } from "@/common/model/schema/user/user.types"
import { db } from "@/common/mongodb"

async function reduceModel<T>(model: Model<T> | Pagination<T>, limit = 20000) {
  logger.info(`reducing collection ${model.collection.name} to ${limit} latest documents`)
  try {
    const aggregationPipeline = [{ $match: {} }, { $sort: { created_at: -1 } }, { $skip: limit }, { $limit: 1 }, { $project: { _id: 0, minDate: "$created_at" } }]

    const result = await model.aggregate(aggregationPipeline)

    if (result.length) {
      await model.deleteMany({ created_at: { $lt: result[0].minDate } })
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
      company_email: "faux_email@faux-domaine-compagnie.com",
    }
  )
}

const obfuscateAppointments = async () => {
  logger.info(`obfuscating appointments`)
  await Appointment.updateMany(
    {},
    {
      cfa_message_to_applicant: "Réponse du cfa ...",
      applicant_message_to_cfa: "Message du candidat ...",
      cfa_recipient_email: "faux_email@faux-domaine-compagnie.com",
    }
  )
}

const obfuscateLbaCompanies = async () => {
  logger.info(`obfuscating lbacompanies`)
  await LbaCompany.updateMany(
    {},
    {
      email: "faux_email@faux-domaine-compagnie.com",
      phone: "0601010106",
    }
  )

  await UnsubscribedLbaCompany.updateMany(
    {},
    {
      email: "faux_email@faux-domaine-compagnie.com",
      phone: "0601010106",
    }
  )
}

const obfuscateElligibleTrainingsForAppointment = async () => {
  logger.info(`obfuscating elligible trainings for appointments`)
  await EligibleTrainingsForAppointment.updateMany(
    {},
    {
      lieu_formation_email: "faux_email@faux-domaine-compagnie.com",
    }
  )
}

const obfuscateEtablissements = async () => {
  logger.info(`obfuscating etablissements`)
  await Etablissement.updateMany(
    {},
    {
      gestionnaire_email: "faux_email@faux-domaine-compagnie.com",
    }
  )
}

const obfuscateFormations = async () => {
  logger.info(`obfuscating formations`)
  await FormationCatalogue.updateMany(
    {},
    {
      email: "faux_email@faux-domaine-compagnie.com",
      etablissement_gestionnaire_courriel: "faux_email@faux-domaine-compagnie.com",
      etablissement_formateur_courriel: "faux_email@faux-domaine-compagnie.com",
      num_tel: "0601010106",
    }
  )
}

const getFakeEmail = () => `${randomUUID()}@${faker.internet.domainName()}`

const obfuscateRecruiter = async () => {
  logger.info(`obfuscating recruiters`)

  const users: AsyncIterable<IUserRecruteur> = db.collection("userrecruteurs").find({})
  for await (const user of users) {
    const replacement = { $set: { email: getFakeEmail(), phone: "0601010106", last_name: "nom_famille", first_name: "prenom" } }

    switch (user.type) {
      case ENTREPRISE: {
        await Promise.all([
          db.collection("userrecruteurs").findOneAndUpdate({ _id: user._id }, replacement),
          db.collection("recruiters").findOneAndUpdate({ establishment_id: user.establishment_id }, replacement),
        ])
        break
      }
      case CFA: {
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

  logger.info(`obfuscating recruiters done`)
}

const obfuscateUser = async () => {
  logger.info(`obfuscating users`)
  const users: AsyncIterable<IUser> = await db.collection("users").find({})
  for await (const user of users) {
    const email = getFakeEmail()
    const replacement = { $set: { password: "removed", email, username: email, phone: "0601010106", lastname: "nom_famille", firstname: "prenom" } }
    await db.collection("users").findOneAndUpdate({ _id: user._id }, replacement)
  }

  logger.info(`obfuscating users done`)
}

export async function obfuscateCollections(): Promise<void> {
  await reduceModel(ApiCalls, 20000)
  await reduceModel(Application, 50000)
  await reduceModel(AnonymizedApplication, 5000)
  await reduceModel(Appointment, 10000)

  await obfuscateApplications()
  await obfuscateAppointments()
  await obfuscateLbaCompanies()
  await obfuscateElligibleTrainingsForAppointment()
  await obfuscateEtablissements()
  await obfuscateFormations()
  await obfuscateRecruiter()
  await obfuscateUser()
}
