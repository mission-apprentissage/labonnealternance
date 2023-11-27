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
  const aggregationPipeline = [
    { $match: {} },
    { $sort: { created_at: -1 } },
    { $limit: limit },
    { $group: { _id: null, minDate: { $min: "$created_at" } } },
    { $project: { _id: 0, minDate: 1 } },
  ]

  const result = await model.aggregate(aggregationPipeline)

  await model.deleteMany({ created_at: { $lt: result[0].minDate } })
}

export async function obfuscateCollections(): Promise<void> {
  await reduceModel(ApiCalls)
  await reduceModel(Application, 50000)
  await reduceModel(AnonymizedApplication, 5000)
  await reduceModel(Appointment, 10000)
}
