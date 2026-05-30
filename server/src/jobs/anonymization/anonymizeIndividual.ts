import type { ObjectId } from "mongodb"
import anonymizedApplicantsModel from "shared/models/anonymizedApplicant.model"
import anonymizedApplicationsModel from "shared/models/anonymizedApplications.model"
import anonymizedUsersWithAccountsModel from "shared/models/anonymizedUsersWithAccounts.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { anonymizeAppointments } from "./anonymizeAppointments"

const anonimizeUserWithAccount = (_id: ObjectId) =>
  getDbCollection("userswithaccounts")
    .aggregate([
      {
        $match: { _id },
      },
      {
        $project: {
          last_action_date: 1,
          origin: 1,
          status: 1,
        },
      },
      {
        $merge: anonymizedUsersWithAccountsModel.collectionName,
      },
    ])
    .toArray()

const deleteUserWithAccount = (query) => getDbCollection("userswithaccounts").deleteMany(query)

const anonymizeApplication = async (_id: ObjectId) => {
  logger.info(`[START] Anonymize applicant & related applications`)
  await getDbCollection("applicants")
    .aggregate([
      {
        $match: { _id },
      },
      {
        $project: {
          _id: 0,
          applicant_id: "$_id",
          createdAt: 1,
        },
      },
      {
        $merge: anonymizedApplicantsModel.collectionName,
      },
    ])
    .toArray()

  await getDbCollection("applications")
    .aggregate([
      {
        $match: { applicant_id: _id },
      },
      {
        $project: {
          company_recruitment_intention: 1,
          company_feedback_date: 1,
          company_siret: 1,
          company_naf: 1,
          job_origin: 1,
          job_id: 1,
          caller: 1,
          created_at: 1,
          applicant_id: 1,
        },
      },
      {
        $merge: anonymizedApplicationsModel.collectionName,
      },
    ])
    .toArray()

  await getDbCollection("applications").deleteMany({ applicant_id: _id })
  await getDbCollection("applicants").deleteOne({ _id })
  logger.info(`[END] Anonymize applicant & related applications`)
}

const anonymizeUser = async (_id: ObjectId) => {
  logger.info(`[START] Anonymized user`)
  await getDbCollection("users")
    .aggregate([
      {
        $match: { _id },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          role: 1,
          last_action_date: 1,
        },
      },
      {
        $merge: "anonymizedusers",
      },
    ])
    .toArray()

  await getDbCollection("users").deleteOne({ _id })
  logger.info(`[END] Anonymized user`)
}

const anonymizeUserWithAccountAndRecruiter = async (userId: ObjectId) => {
  logger.info(`[START] Anonymized user with account & related recruiters`)
  const user = await getDbCollection("userswithaccounts").findOne({ _id: userId })
  if (!user) {
    throw new Error("Anonymize user with account not found")
  }
  await anonimizeUserWithAccount(userId)
  await deleteUserWithAccount({ _id: userId })
  logger.info(`[END] Anonymized user with account & related recruiters`)
}

export async function anonymizeIndividual({ collection, id }: { collection: string; id: ObjectId }): Promise<void> {
  switch (collection) {
    case "applications": {
      await anonymizeApplication(id)
      break
    }
    case "users": {
      await anonymizeUser(id)
      break
    }
    case "userrecruteurs": {
      await anonymizeUserWithAccountAndRecruiter(id)
      break
    }
    case "appointments": {
      await anonymizeAppointments({ _id: id })
      break
    }
    default:
      throw new Error(`collection ${collection} unsupported`)
  }
}
export default anonymizeIndividual
