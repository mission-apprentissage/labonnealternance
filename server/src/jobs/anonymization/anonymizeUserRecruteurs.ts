import dayjs from "dayjs"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { UserWithAccount } from "../../common/model/index"
import { notifyToSlack } from "../../common/utils/slackUtils"

const anonymize = async () => {
  const fromDate = dayjs().subtract(2, "years").toDate()
  const userWithAccountQuery = { $or: [{ last_action_date: { $lte: fromDate } }, { last_action_date: null, createdAt: { $lte: fromDate } }] }
  const usersToAnonymize = await UserWithAccount.find(userWithAccountQuery).lean()
  const userIds = usersToAnonymize.map(({ _id }) => _id.toString())
  const recruiterQuery = { "jobs.managed_by": { $in: userIds } }
  await UserWithAccount.aggregate([
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
      // @ts-ignore
      $merge: "anonymizeduserswithaccounts",
    },
  ])
  await getDbCollection("recruiters").aggregate([
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
      // @ts-ignore
      $merge: "anonymizedrecruiteurs",
    },
  ])
  const { deletedCount: recruiterCount } = await getDbCollection("recruiters").deleteMany(recruiterQuery)
  const { deletedCount: userWithAccountCount } = await UserWithAccount.deleteMany(userWithAccountQuery)
  return { userWithAccountCount, recruiterCount }
}

export async function anonimizeUserRecruteurs() {
  const subject = "ANONYMISATION DES USERS et RECRUITERS"
  try {
    logger.info(" -- Anonymisation des users de plus de 2 ans -- ")

    const { recruiterCount, userWithAccountCount } = await anonymize()

    await notifyToSlack({
      subject,
      message: `Anonymisation des users de plus de 2 ans terminée. ${userWithAccountCount} user(s) anonymisé(s). ${recruiterCount} recruiter(s) anonymisé(s)`,
      error: false,
    })
  } catch (err: any) {
    await notifyToSlack({ subject, message: `ECHEC anonymisation des user recruteurs`, error: true })
    throw err
  }
}
