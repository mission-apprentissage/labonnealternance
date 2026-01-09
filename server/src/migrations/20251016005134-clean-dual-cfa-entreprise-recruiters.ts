import { AccessEntityType, IRecruiter } from "shared"
import { RECRUITER_STATUS } from "shared/constants/recruteur"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const removeCfaManagement = async (recruiters: IRecruiter[], now: Date) => {
  await asyncForEach(recruiters, async (recruiter) => {
    logger.info(`Archiving recruiter with naf85 : ${recruiter.establishment_raison_sociale}. is_delegated: ${recruiter.is_delegated}`)
    await getDbCollection("recruiters").updateOne({ _id: recruiter._id }, { $set: { updatedAt: now, status: RECRUITER_STATUS.ARCHIVE } })

    const cfa = await getDbCollection("cfas").findOne({ siret: recruiter.establishment_siret })
    if (cfa) {
      await getDbCollection("rolemanagements").deleteOne({ authorized_type: AccessEntityType.CFA, authorized_id: cfa._id.toString() })
    }
  })
}

export const up = async () => {
  logger.info("Starting migration: clean dual cfa entreprise recruiters")

  const now = new Date()

  await getDbCollection("recruiters").updateMany(
    {
      $expr: { $eq: ["$establishment_siret", "$cfa_delegated_siret"] },
    },
    { $set: { updatedAt: now, status: RECRUITER_STATUS.ARCHIVE } }
  )

  const selfDelegatedRecruiters = await getDbCollection("recruiters")
    .find({ $expr: { $eq: ["$establishment_siret", "$cfa_delegated_siret"] } })
    .toArray()

  await removeCfaManagement(selfDelegatedRecruiters, now)

  const recruitersWithNaf85NotSelfDelegated = await getDbCollection("recruiters")
    .find({ naf_code: /^85/, $expr: { $ne: ["$establishment_siret", "$cfa_delegated_siret"] } })
    .toArray()

  await removeCfaManagement(recruitersWithNaf85NotSelfDelegated, now)

  logger.info("Migration completed: clean dual cfa entreprise recruiters")
}

export const requireShutdown: boolean = false
