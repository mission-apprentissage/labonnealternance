import dayjs from "dayjs"
import anonymizedRecruitersModel from "shared/models/anonymizedRecruiters.model"
import anonymizedUsersWithAccountsModel from "shared/models/anonymizedUsersWithAccounts.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { notifyToSlack } from "../../common/utils/slackUtils"

const anonymize = async () => {
  const fromDate = dayjs().subtract(2, "years").toDate()
  const userWithAccountQuery = { $or: [{ last_action_date: { $lte: fromDate } }, { last_action_date: null, createdAt: { $lte: fromDate } }] }
  const usersToAnonymize = await getDbCollection("userswithaccounts").find(userWithAccountQuery).toArray()
  const userIds = usersToAnonymize.map(({ _id }) => _id.toString())
  const recruiterQuery = { managed_by: { $in: userIds } } //TODO: à mettre à jour quand multi compte

  await getDbCollection("userswithaccounts")
    .aggregate([
      {
        $match: userWithAccountQuery,
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
  await getDbCollection("recruiters")
    .aggregate([
      {
        $match: recruiterQuery,
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
  const { deletedCount: recruiterCount } = await getDbCollection("recruiters").deleteMany(recruiterQuery)
  const { deletedCount: userWithAccountCount } = await getDbCollection("userswithaccounts").deleteMany(userWithAccountQuery)
  return { userWithAccountCount, recruiterCount }
}

export async function anonimizeUsersWithAccounts() {
  logger.info("[START] Anonymisation des users de plus de 2 ans")
  try {
    const { recruiterCount, userWithAccountCount } = await anonymize()

    await notifyToSlack({
      subject: "ANONYMISATION DES USERWITHACCOUNT et RECRUITERS",
      message: `Anonymisation des comptes recruteurs de plus de 2 ans terminée. ${userWithAccountCount} userWithAccount anonymisé(s). ${recruiterCount} recruiter(s) anonymisé(s)`,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION DES USERWITHACCOUNT et RECRUITERS", message: `ECHEC anonymisation des comptes recruteurs`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des users de plus de 2 ans")
}
