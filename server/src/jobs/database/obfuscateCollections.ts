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
  UserRecruteur,
} from "@/common/model/index"
import { Pagination } from "@/common/model/schema/_shared/mongoose-paginate"
import { db } from "@/common/mongodb"

import { asyncForEach } from "../../common/utils/asyncUtils"
import { ADMIN, OPCO } from "../../services/constant.service"

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

const obfuscateRecruiterAndUsers = async () => {
  logger.info(`obfuscating recruiters and users`)
  const users: IUserRecruteur[] = await db
    .collection("userrecruteurs")
    .find({ type: { $in: [ENTREPRISE, CFA] } })
    .toArray()
  await asyncForEach(users, async (user) => {
    let email = faker.internet.email()
    let exist

    do {
      exist = await db.collection("userrecruteurs").countDocuments({ email })
      email = faker.internet.email()
    } while (exist > 1)

    switch (user.type) {
      case ENTREPRISE:
        await Promise.all([
          db.collection("userrecruteurs").findOneAndUpdate({ _id: user._id }, { email }),
          db.collection("recruiters").findOneAndUpdate({ establishment_id: user.establishment_id }, { email }),
        ])
        break
      case CFA:
        await Promise.all([
          db.collection("userrecruteurs").findOneAndUpdate({ _id: user._id }, { email }),
          db.collection("recruiters").updateMany({ cfa_delegated_siret: user.establishment_siret }, { email }),
        ])
        break

      default:
        break
    }
  })
  logger.info(`obfuscating recruiters and users done`)
}

const obfuscateSpecificUsers = async () => {
  logger.info(`obfuscating specific users`)
  await UserRecruteur.updateMany(
    { type: OPCO },
    {
      email: faker.internet.email({ provider: "opco.fr" }),
      phone: "0601010106",
      last_name: "nom_famille",
      first_name: "prenom",
    }
  )
  await UserRecruteur.updateMany(
    { type: ADMIN },
    {
      email: faker.internet.email({ provider: "admin.fr" }),
      phone: "0601010106",
      last_name: "nom_famille",
      first_name: "prenom",
    }
  )
}

export async function obfuscateCollections(): Promise<void> {
  await reduceModel(ApiCalls)
  await reduceModel(Application, 50000)
  await reduceModel(AnonymizedApplication, 5000)
  await reduceModel(Appointment, 10000)

  await obfuscateApplications()
  await obfuscateAppointments()
  await obfuscateLbaCompanies()
  await obfuscateElligibleTrainingsForAppointment()
  await obfuscateEtablissements()
  await obfuscateFormations()
  await obfuscateRecruiterAndUsers()
  await obfuscateSpecificUsers()
}
