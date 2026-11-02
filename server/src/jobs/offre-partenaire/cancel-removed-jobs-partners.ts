import type { Filter } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { alertGuardrailBlock, formatRate, getGuardrailThresholds } from "./jobs-partners-guardrails"

export type RemovalGuardBlock = { partner_label: string; active: number; removed: number; rate: number; maxRate: number }

const matchComputedByKey = {
  $match: {
    $expr: {
      $and: [{ $eq: ["$partner_label", "$$partnerLabel"] }, { $eq: ["$partner_job_id", "$$partnerJobId"] }],
    },
  },
}

const findRemovalGuardBlocks = async (activeMatchStage: object): Promise<RemovalGuardBlock[]> => {
  const stats = await getDbCollection("jobs_partners")
    .aggregate<{ _id: string; active: number; removed: number }>([
      activeMatchStage,
      {
        $lookup: {
          from: "computed_jobs_partners",
          let: { partnerLabel: "$partner_label", partnerJobId: "$partner_job_id" },
          pipeline: [matchComputedByKey, { $limit: 1 }, { $project: { _id: 1 } }],
          as: "matched",
        },
      },
      { $group: { _id: "$partner_label", active: { $sum: 1 }, removed: { $sum: { $cond: [{ $eq: [{ $size: "$matched" }, 0] }, 1, 0] } } } },
    ])
    .toArray()

  return stats.flatMap(({ _id: partner_label, active, removed }) => {
    const { maxRemovedCancellationRate, minRemovedCountToBlock } = getGuardrailThresholds(partner_label)
    const rate = removed / active
    return removed >= minRemovedCountToBlock && rate > maxRemovedCancellationRate ? [{ partner_label, active, removed, rate, maxRate: maxRemovedCancellationRate }] : []
  })
}

export const formatRemovalGuardBlock = ({ partner_label, active, removed, rate, maxRate }: RemovalGuardBlock) =>
  `${partner_label} : ${removed} offres actives sur ${active} (${formatRate(rate)}) absentes du flux, seuil ${formatRate(maxRate)}. Aucune annulation « supprimée du flux » pour ce partenaire. Après vérification : yarn cli forceCancelRemovedJobsPartners --partnerLabel "${partner_label}"`

/**
 * Annule les offres jobs_partners absentes (ou expirées) du flux source correspondant.
 *
 * IMPORTANT : `matchFilter` est obligatoire et ne doit jamais être vide. Un filtre vide
 * annulerait toutes les offres actives tous partenaires confondus. Cette fonction n'est donc
 * pas exposée en CLI : passer par les sous-jobs dédiés (cancelRemovedJobsPartnersFlux,
 * cancelRemovedJobsPartnersRecruteursLba, forceCancelRemovedJobsPartners) qui encapsulent leur filtre respectif.
 *
 * `removalGuard` : un partenaire dont les annulations « supprimée du flux » dépassent le seuil
 * (cf. getGuardrailThresholds) n'en subit aucune et est renvoyé dans `blocked`. L'appelant fait échouer le job
 * une fois le reste du traitement terminé.
 */
export const cancelRemovedJobsPartners = async (matchFilter: Filter<IComputedJobsPartners>, { removalGuard }: { removalGuard: boolean }) => {
  logger.info("début de cancelRemovedJobsPartners")

  if (!matchFilter || Object.keys(matchFilter).length === 0) {
    throw new Error("cancelRemovedJobsPartners: matchFilter is required and must not be empty")
  }

  const matchStage = {
    $match: {
      $and: [matchFilter, { offer_status: JOB_STATUS_ENGLISH.ACTIVE }],
    },
  }

  const blocked = removalGuard ? await findRemovalGuardBlocks(matchStage) : []
  for (const block of blocked) {
    await alertGuardrailBlock(`Annulation des offres ${block.partner_label}`, formatRemovalGuardBlock(block))
  }
  const removalMatchStage = blocked.length
    ? { $match: { $and: [...matchStage.$match.$and, { partner_label: { $nin: blocked.map(({ partner_label }) => partner_label) } }] } }
    : matchStage

  const setStages = {
    $set: {
      offer_status: JOB_STATUS_ENGLISH.ANNULEE,
      // updated_at : requis par le cron delta de l'index de recherche (syncSearchItemsDelta).
      updated_at: new Date(),
    },
  }
  const unsetStage = {
    $unset: "matched",
  }
  const mergeStage = {
    $merge: {
      into: "jobs_partners",
      on: "_id",
      whenMatched: "merge",
      whenNotMatched: "discard",
    },
  }

  const pipeline = [
    removalMatchStage,
    {
      $lookup: {
        from: "computed_jobs_partners",
        let: { partnerLabel: "$partner_label", partnerJobId: "$partner_job_id" },
        pipeline: [matchComputedByKey],
        as: "matched",
      },
    },
    {
      $match: {
        matched: { $size: 0 },
      },
    },
    setStages,
    {
      $set: {
        offer_status_history: {
          $concatArrays: [
            "$offer_status_history",
            [
              {
                date: new Date(),
                status: JOB_STATUS_ENGLISH.ANNULEE,
                reason: `supprimée du flux source`,
                granted_by: "cancel-removed-jobs-partners",
              },
            ],
          ],
        },
      },
    },
    unsetStage,
    mergeStage,
  ]

  logger.info("suppression des offres absentes du flux")
  await getDbCollection("jobs_partners").aggregate(pipeline).toArray()

  const pipeline_expired = [
    matchStage,
    {
      $lookup: {
        from: "computed_jobs_partners",
        let: {
          partnerLabel: "$partner_label",
          partnerJobId: "$partner_job_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$partner_label", "$$partnerLabel"] },
                  { $eq: ["$partner_job_id", "$$partnerJobId"] },
                  { $ne: ["$business_error", null] },
                  // CLASSIFICATION_PENDING est un état transitoire de traitement (batch Mistral en
                  // cours), pas un verdict métier : l'offre garde le statut qu'elle avait. Sans
                  // cette exclusion, tout le catalogue non whitelisté était annulé chaque nuit à
                  // 00h35 puis réactivé au retour du batch (mesuré en prod : 5 000 à 6 700
                  // annulations/nuit chez Hellowork et France Travail).
                  { $ne: ["$business_error", JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING] },
                ],
              },
            },
          },
        ],
        as: "matched",
      },
    },
    {
      $match: {
        matched: {
          $ne: [],
        },
      },
    },
    setStages,
    {
      $set: {
        offer_status_history: {
          $concatArrays: [
            "$offer_status_history",
            [
              {
                date: new Date(),
                status: JOB_STATUS_ENGLISH.ANNULEE,
                reason: `offre expirée`,
                granted_by: "cancel-removed-jobs-partners",
              },
            ],
          ],
        },
      },
    },
    unsetStage,
    mergeStage,
  ]

  logger.info("suppression des offres expirées")
  await getDbCollection("jobs_partners").aggregate(pipeline_expired).toArray()

  logger.info("fin de cancelRemovedJobsPartners")
  return { blocked }
}
