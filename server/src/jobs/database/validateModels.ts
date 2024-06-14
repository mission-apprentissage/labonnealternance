import { captureException } from "@sentry/node"
import { Model } from "mongoose"
import {
  ZApiCall,
  ZApplication,
  ZAppointment,
  ZCredential,
  ZDiplomesMetiers,
  ZDomainesMetiers,
  ZLbaCompany,
  ZLbaLegacyCompany,
  ZReferentielOnisep,
  ZReferentielOpco,
  ZUnsubscribeOF,
  ZUnsubscribedLbaCompany,
  ZUser,
} from "shared/models"
import { zCFA } from "shared/models/cfa.model"
import { ZRoleManagement } from "shared/models/roleManagement.model"
import { ZUserWithAccount } from "shared/models/userWithAccount.model"
import { ZodType } from "zod"

import { logger } from "@/common/logger"
import {
  ApiCalls,
  Application,
  Appointment,
  AppointmentDetailed,
  Cfa,
  Credential,
  DiplomesMetiers,
  DomainesMetiers,
  LbaCompany,
  LbaCompanyLegacy,
  ReferentielOnisep,
  ReferentielOpco,
  RoleManagement,
  UnsubscribeOF,
  UnsubscribedLbaCompany,
  User,
  UserWithAccount,
} from "@/common/model/index"
import { Pagination } from "@/common/model/schema/_shared/mongoose-paginate"

async function validateModel<T>(model: Model<T> | Pagination<T>, z: ZodType<T, any, any>) {
  const collectionName = model.collection.name
  const cursor = model.find({}).lean()

  let totalCount = 0
  let count = 0
  const errorStats: Record<string, number> = {}
  for await (const doc of cursor) {
    try {
      totalCount++
      z.parse(doc)
    } catch (err) {
      count++

      if (err && typeof err === "object" && "issues" in err && Array.isArray(err.issues)) {
        err.issues.forEach(({ code, path, expected, received, message }) => {
          const pointPath = path.join(".")
          const key = `${pointPath}: code=${code}, expected=${expected}, received=${received}, message=${message}`
          const oldCount = errorStats[key] ?? 0
          errorStats[key] = oldCount + 1
        })
      }
    }
  }

  if (count > 0) {
    const errorMessage = `Found ${count}/${totalCount} invalid document for ${collectionName}
    Error cases:
    ${Object.entries(errorStats)
      .map(([message, count]) => `${count} : ${message}`)
      .join("\n")}
    `
    logger.error(errorMessage)
    captureException(new Error(errorMessage))
  } else {
    logger.info(`All documents ${totalCount} for ${collectionName} are valid`)
  }
}

export async function validateModels(): Promise<void> {
  // TODO: Create Zod for missing models
  await validateModel(ApiCalls, ZApiCall)
  await validateModel(Application, ZApplication)
  await validateModel(Appointment, ZAppointment)
  await validateModel(AppointmentDetailed, ZAppointment)
  await validateModel(Credential, ZCredential)
  await validateModel(DiplomesMetiers, ZDiplomesMetiers)
  await validateModel(DomainesMetiers, ZDomainesMetiers)
  await validateModel(LbaCompany, ZLbaCompany)
  await validateModel(LbaCompanyLegacy, ZLbaLegacyCompany)
  await validateModel(ReferentielOnisep, ZReferentielOnisep)
  await validateModel(User, ZUser)
  await validateModel(ReferentielOpco, ZReferentielOpco)
  await validateModel(UnsubscribeOF, ZUnsubscribeOF)
  await validateModel(UnsubscribedLbaCompany, ZUnsubscribedLbaCompany)
  // await validateModel(UserRecruteur, ZUserRecruteur)
  await validateModel(Cfa, zCFA)
  await validateModel(UserWithAccount, ZUserWithAccount)
  await validateModel(RoleManagement, ZRoleManagement)
}
