import type { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { checkForJobActivations } from "@/services/formulaire.service"
import { JOB_PENDING_EXPIRATION_ORIGIN } from "@/services/job-partner-status.service"

/**
 * Publie les offres restées en attente alors que le compte peut publier (#5762) : checkForJobActivations relisait la
 * validation sur un secondaire pas encore répliqué et ne publiait rien. Elle est relancée pour chaque couple
 * recruteur / entreprise qui a une offre en attente, ou annulée à son expiration pendant l'attente, et ne publie que
 * si l'e-mail est confirmé et le rôle accordé. Idempotente : une offre publiée n'est plus candidate.
 */
export const up = async () => {
  const pairs = await getDbCollection("jobs_partners")
    .aggregate<{ _id: { managed_by: ObjectId; siret: string } }>([
      {
        $match: {
          partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
          managed_by: { $ne: null },
          $or: [{ offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE }, { offer_status: JOB_STATUS_ENGLISH.ANNULEE, "offer_status_history.granted_by": JOB_PENDING_EXPIRATION_ORIGIN }],
        },
      },
      { $group: { _id: { managed_by: "$managed_by", siret: "$workplace_siret" } } },
    ])
    .toArray()

  let published = 0
  await asyncForEach(pairs, async ({ _id: { managed_by, siret } }) => {
    const entreprise = await getDbCollection("entreprises").findOne({ siret }, { projection: { _id: 1 } })
    if (!entreprise) return
    published += (await checkForJobActivations(managed_by, entreprise._id)).length
  })
  logger.info(`#5762 : ${published} offres en attente publiées, sur ${pairs.length} couples recruteur / entreprise examinés`)
}

export const requireShutdown: boolean = false
