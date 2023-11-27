// import { captureException } from "@sentry/node"
import { Model } from "mongoose"
// import {
//   ZApplication,
//   ZAppointment,
//   ZCredential,
//   ZEligibleTrainingsForAppointmentSchema,
//   ZEtablissement,
//   ZJob,
//   ZLbaCompany,
//   ZOptout,
//   ZRecruiter,
//   ZReferentielOpco,
//   ZUnsubscribeOF,
//   ZUnsubscribedLbaCompany,
//   ZUserRecruteur,
//   zFormationCatalogueSchema,
// } from "shared/models"
// import { ZodType } from "zod"

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
  //  await validateModel(ApiCalls, ZApiCalls)
  // await validateModel(Application, ZApplication)
  // await validateModel(Appointment, ZAppointment)
  // await validateModel(AppointmentDetailed, ZAppointment)
  // await validateModel(Credential, ZCredential)
  // //  await validateModel(DiplomesMetiers, ZDiplomesMetiers)
  // //  await validateModel(DomainesMetiers, ZDomainesMetiers)
  // await validateModel(EligibleTrainingsForAppointment, ZEligibleTrainingsForAppointmentSchema)
  // // await validateModel(EmailBlacklist, ZEmailBlacklist)
  // await validateModel(Etablissement, ZEtablissement)
  // await validateModel(FormationCatalogue, zFormationCatalogueSchema)
  // //  await validateModel(GeoLocation, ZGeoLocation)
  // //  await validateModel(InternalJobs, ZInternalJobs)
  // await validateModel(Job, ZJob)
  // await validateModel(LbaCompany, ZLbaCompany)
  // await validateModel(LbaCompanyLegacy, ZLbaCompany)
  // //  await validateModel(Opco, ZOpco)
  // await validateModel(Optout, ZOptout)
  // await validateModel(Recruiter, ZRecruiter)
  // // await validateModel(ReferentielOnisep, ZReferentielOnisep)
  // await validateModel(ReferentielOpco, ZReferentielOpco)
  // // await validateModel(ReferentielRome, ZReferentielRome)
  // // await validateModel(RncpRomes, ZRncpRomes)
  // await validateModel(UnsubscribeOF, ZUnsubscribeOF)
  // await validateModel(UnsubscribedLbaCompany, ZUnsubscribedLbaCompany)
  // // await validateModel(User, ZUser)
  // await validateModel(UserRecruteur, ZUserRecruteur)
  // await validateModel(eligibleTrainingsForAppointmentHistory, ZEligibleTrainingsForAppointmentSchema)
}
