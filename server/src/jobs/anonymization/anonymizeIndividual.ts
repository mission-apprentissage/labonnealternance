import { ObjectId } from "mongodb"
import anonymizedApplicantsModel from "shared/models/anonymizedApplicant.model"
import anonymizedApplicationsModel from "shared/models/anonymizedApplications.model"
import anonymizedRecruitersModel from "shared/models/anonymizedRecruiters.model"
import anonymizedUsersWithAccountsModel from "shared/models/anonymizedUsersWithAccounts.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"

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

const anonimizeRecruiterByUserId = (userId: ObjectId) =>
  getDbCollection("recruiters")
    .aggregate([
      {
        $match: { "jobs.managed_by": userId },
      },
      {
        $project: {
          establishment_id: 1,
          establishment_raison_sociale: 1,
          establishment_enseigne: 1,
          establishment_siret: 1,
          address_detail: 1,
          address: 1,
          geo_coordinates: 1,
          is_delegated: 1,
          cfa_delegated_siret: 1,
          jobs: 1,
          origin: 1,
          opco: 1,
          idcc: 1,
          status: 1,
          naf_code: 1,
          naf_label: 1,
          establishment_size: 1,
          establishment_creation_date: 1,
        },
      },
      {
        $merge: anonymizedRecruitersModel.collectionName,
      },
    ])
    .toArray()

const deleteRecruiter = (query) => getDbCollection("recruiters").deleteMany(query)
const deleteUserWithAccount = (query) => getDbCollection("userswithaccounts").deleteMany(query)

const anonymizeApplication = async (_id: ObjectId) => {
  logger.info(`[START] Anonymized applicant & related applications`)
  const applicant = await getDbCollection("applicants")
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

  const applicantId = applicant[0]._id
  await getDbCollection("applications")
    .aggregate([
      {
        $match: { applicant_id: applicantId },
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

  await getDbCollection("applications").deleteOne({ _id })
  logger.info(`[END] Anonymized applicant & related applications`)
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
  await Promise.all([anonimizeUserWithAccount(userId), anonimizeRecruiterByUserId(userId)])
  await Promise.all([deleteUserWithAccount({ _id: userId }), deleteRecruiter({ "jobs.managed_by": userId })])
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
