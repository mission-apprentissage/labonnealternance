import { Model } from "mongoose"

import { logger } from "@/common/logger"
import {
  Application,
  EligibleTrainingsForAppointment,
  Etablissement,
  FormationCatalogue,
  LbaCompany,
  // Recruiter,
  UnsubscribedLbaCompany,
  // UserRecruteur,
  ApiCalls,
  AnonymizedApplication,
  Appointment,
} from "@/common/model/index"
import { Pagination } from "@/common/model/schema/_shared/mongoose-paginate"

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

// // TODO Kevin
// const obfuscateRecruiter = async () => {
//   logger.info(`obfuscating recruiters`)
//   await Recruiter.updateMany(
//     {},
//     {
//       //email: "faux_email@faux-domaine-compagnie.com", TODO should be unique
//       phone: "0601010106",
//       last_name: "nom_famille",
//       first_name: "prenom",
//     }
//   )
// }

// // TODO Kevin
// const obfuscateUserRecruiter = async () => {
//   logger.info(`obfuscating recruiters`)
//   await UserRecruteur.updateMany(
//     {},
//     {
//       //email: "faux_email@faux-domaine-compagnie.com", TODO should be unique
//       phone: "0601010106",
//       last_name: "nom_famille",
//       first_name: "prenom",
//     }
//   )
// }

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
  // await obfuscateRecruiter()
  // await obfuscateRecruiter()
}
