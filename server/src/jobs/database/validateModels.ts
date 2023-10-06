import { captureException } from "@sentry/node"
import { Model } from "mongoose"
import {
  ZApplication,
  ZAppointment,
  ZCredential,
  ZEligibleTrainingsForAppointmentSchema,
  ZEtablissement,
  ZJob,
  ZLbaCompany,
  ZOptout,
  ZRecruiter,
  ZUserRecruteur,
  zFormationCatalogueSchema,
} from "shared/models"
import { ZodType } from "zod"

import { logger } from "@/common/logger"
import {
  Application,
  Appointment,
  AppointmentDetailed,
  Credential,
  EligibleTrainingsForAppointment,
  Etablissement,
  FormationCatalogue,
  Job,
  LbaCompany,
  LbaCompanyLegacy,
  Optout,
  Recruiter,
  UserRecruteur,
  eligibleTrainingsForAppointmentHistory,
} from "@/common/model/index"
import { Pagination } from "@/common/model/schema/_shared/mongoose-paginate"

async function validateModel<T>(model: Model<T> | Pagination<T>, z: ZodType<T, any, any>) {
  const cursor = model.find({}, { lean: true })

  let totalCount = 0
  let count = 0
  for await (const doc of cursor) {
    try {
      totalCount++
      z.parse(doc)
    } catch (err) {
      count++
    }
  }

  if (count > 0) {
    const e = new Error(`Found ${count}/${totalCount} invalid document for ${model.name}`)
    logger.error(e)
    captureException(e)
  }
  logger.info(`All documents ${totalCount} for ${model.name} are valid`)
}

export async function validateModels(): Promise<void> {
  // TODO: Create Zod for missing models

  //  await validateModel(ApiCalls, ZApiCalls)
  await validateModel(Application, ZApplication)
  await validateModel(Appointment, ZAppointment)
  await validateModel(AppointmentDetailed, ZAppointment)
  await validateModel(Credential, ZCredential)
  //  await validateModel(DiplomesMetiers, ZDiplomesMetiers)
  //  await validateModel(DomainesMetiers, ZDomainesMetiers)
  await validateModel(EligibleTrainingsForAppointment, ZEligibleTrainingsForAppointmentSchema)
  // await validateModel(EmailBlacklist, ZEmailBlacklist)
  await validateModel(Etablissement, ZEtablissement)
  await validateModel(FormationCatalogue, zFormationCatalogueSchema)
  //  await validateModel(GeoLocation, ZGeoLocation)
  //  await validateModel(InternalJobs, ZInternalJobs)
  await validateModel(Job, ZJob)
  await validateModel(LbaCompany, ZLbaCompany)
  await validateModel(LbaCompanyLegacy, ZLbaCompany)
  //  await validateModel(Opco, ZOpco)
  await validateModel(Optout, ZOptout)
  await validateModel(Recruiter, ZRecruiter)
  // await validateModel(ReferentielOnisep, ZReferentielOnisep)
  // await validateModel(ReferentielOpco, ZReferentielOpco)
  // await validateModel(ReferentielRome, ZReferentielRome)
  // await validateModel(RncpRomes, ZRncpRomes)
  // await validateModel(UnsubscribeOF, ZUnsubscribeOF)
  // await validateModel(UnsubscribedLbaCompany, ZUnsubscribedLbaCompany)
  // await validateModel(User, ZUser)
  await validateModel(UserRecruteur, ZUserRecruteur)
  await validateModel(eligibleTrainingsForAppointmentHistory, ZEligibleTrainingsForAppointmentSchema)
}
