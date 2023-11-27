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
import {
  // Application,
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

async function reduceModel<T>(model: Model<T> | Pagination<T>, limit = 50000) {
  const docsToKeep = await model.find({}).sort({ created_at: -1 }).skip(limit)
  await model.deleteMany({ _id: { $nin: docsToKeep.map((doc) => doc._id) } })
}

export async function obfuscateCollections(): Promise<void> {
  await reduceModel(ApiCalls)
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
