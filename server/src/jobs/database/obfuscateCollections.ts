// import { captureException } from "@sentry/node"
import { Model } from "mongoose"

// import { logger } from "@/common/logger"
import { logger } from "@/common/logger"
import {
  Application,
  // Appointment,
  // AppointmentDetailed,
  // Credential,
  // EligibleTrainingsForAppointment,
  // Etablissement,
  // FormationCatalogue,
  // Job,
  // LbaCompany,
  // LbaCompanyLegacy,
  // Optout,
  // Recruiter,
  // ReferentielOpco,
  // UnsubscribeOF,
  // UnsubscribedLbaCompany,
  // UserRecruteur,
  // eligibleTrainingsForAppointmentHistory,
  ApiCalls,
  AnonymizedApplication,
  Appointment,
} from "@/common/model/index"
import { Pagination } from "@/common/model/schema/_shared/mongoose-paginate"

async function reduceModel<T>(model: Model<T> | Pagination<T>, limit = 20000) {
  logger.info(`reducing collection ${model.collection.name} to ${limit} latest documents`)
  try {
    const aggregationPipeline = [
      { $match: {} },
      { $sort: { created_at: -1 } },
      { $limit: limit },
      { $group: { _id: null, minDate: { $min: "$created_at" } } },
      { $project: { _id: 0, minDate: 1 } },
    ]

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

export async function obfuscateCollections(): Promise<void> {
  await reduceModel(ApiCalls)
  await reduceModel(Application, 50000)
  await reduceModel(AnonymizedApplication, 5000)
  await reduceModel(Appointment, 10000)

  await obfuscateApplications()
  await obfuscateAppointments()
}
