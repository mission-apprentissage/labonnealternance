import dayjs from "shared/helpers/dayjs"
import anonymizedUsersWithAccountsModel from "shared/models/anonymizedUsersWithAccounts.model"

import { ObjectId } from "mongodb"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

const anonymize = async () => {
  const fromDate = dayjs().subtract(2, "years").toDate()
  const userWithAccountQuery = { last_action_date: { $lte: fromDate } }
  const usersToAnonymize = await getDbCollection("userswithaccounts").find(userWithAccountQuery).toArray()
  const userIds = usersToAnonymize.map(({ _id }) => _id.toString())

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

  await getDbCollection("rolemanagements").deleteMany({
    user_id: { $in: userIds.map((id) => new ObjectId(id)) },
  })

  const { deletedCount: userWithAccountCount } = await getDbCollection("userswithaccounts").deleteMany(userWithAccountQuery)
  return { userWithAccountCount }
}

export async function anonimizeUsersWithAccounts() {
  logger.info("[START] Anonymisation des users de plus de 2 ans")
  try {
    const { userWithAccountCount } = await anonymize()

    await notifyToSlack({
      subject: "ANONYMISATION DES USERWITHACCOUNT et RECRUITERS",
      message: `Anonymisation des comptes recruteurs de plus de 2 ans terminée. ${userWithAccountCount} userWithAccount anonymisé(s).`,
    })
  } catch (err: any) {
    await notifyToSlack({ subject: "ANONYMISATION DES USERWITHACCOUNT et RECRUITERS", message: `ECHEC anonymisation des comptes recruteurs`, error: true })
    throw err
  }
  logger.info("[END] Anonymisation des users de plus de 2 ans")
}
