import { ObjectId } from "mongodb"
import dayjs from "shared/helpers/dayjs"
import anonymizedUsersWithAccountsModel from "shared/models/anonymized-users-with-accounts.model"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { changeJobsPartnersStatus } from "@/services/job-partner-status.service"

const anonymize = async () => {
  const fromDate = dayjs().subtract(2, "years").toDate()
  const userWithAccountQuery = { last_action_date: { $lte: fromDate } }
  const usersToAnonymize = await getDbCollection("userswithaccounts").find(userWithAccountQuery).toArray()
  const userIds = usersToAnonymize.map(({ _id }) => _id.toString())
  const userObjectIds = usersToAnonymize.map(({ _id }) => _id)

  // Restreint aux offres encore ouvertes : une offre déjà close garde son statut et son motif
  // d'origine, sinon l'anonymisation réécrivait `updated_at` sur des annulations anciennes, qui
  // remontaient dans les tableaux de bord datés sur ce champ, et écrasait les offres POURVUE
  // (issue #5429). `managed_by` est détaché sur tout le périmètre, close ou non, par l'update
  // séparé ci-dessous : c'est lui qui porte l'anonymisation proprement dite.
  await changeJobsPartnersStatus(
    {
      managed_by: { $in: userObjectIds },
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_status: { $in: [JOB_STATUS_ENGLISH.ACTIVE, JOB_STATUS_ENGLISH.EN_ATTENTE] },
    },
    { status: JOB_STATUS_ENGLISH.ANNULEE, reason: "compte recruteur anonymisé RGPD", grantedBy: "anonimize-users-with-accounts" }
  )
  await getDbCollection("jobs_partners").updateMany({ managed_by: { $in: userObjectIds }, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA }, { $set: { managed_by: null } })

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
