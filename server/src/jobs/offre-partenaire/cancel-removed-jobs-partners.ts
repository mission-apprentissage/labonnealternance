import type { Filter, ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { alertGuardrailBlock, formatRate, getGuardrailThresholds, REMOVAL_GRACE_DAYS } from "./jobs-partners-guardrails"

/** `removed` : offres sorties du flux depuis le run précédent, seules comptées par le garde-fou. */
export type RemovalGuardBlock = { partner_label: string; active: number; removed: number; rate: number; maxRate: number }

const DAY_MS = 24 * 60 * 60 * 1000
// Le run de nuit ne démarre pas à la minute près : sans marge, l'annulation au terme du délai glisserait d'une nuit.
const RUN_START_JITTER_MS = 6 * 60 * 60 * 1000

const matchComputedByKey = {
  $match: {
    $expr: {
      $and: [{ $eq: ["$partner_label", "$$partnerLabel"] }, { $eq: ["$partner_job_id", "$$partnerJobId"] }],
    },
  },
}

const lookupInFlux = {
  $lookup: {
    from: "computed_jobs_partners",
    let: { partnerLabel: "$partner_label", partnerJobId: "$partner_job_id" },
    pipeline: [matchComputedByKey, { $limit: 1 }, { $project: { _id: 1 } }],
    as: "matched",
  },
}

const findIds = async (match: object, { inFlux }: { inFlux: boolean }) => {
  const docs = await getDbCollection("jobs_partners")
    .aggregate<{ _id: ObjectId }>([{ $match: match }, lookupInFlux, { $match: { matched: inFlux ? { $ne: [] } : { $size: 0 } } }, { $project: { _id: 1 } }])
    .toArray()
  return docs.map(({ _id }) => _id)
}

const isNewAbsence = { $and: [{ $eq: [{ $size: "$matched" }, 0] }, { $eq: [{ $ifNull: ["$flux_absent_since", null] }, null] }] }

const findRemovalGuardBlocks = async (activeMatch: object): Promise<RemovalGuardBlock[]> => {
  const stats = await getDbCollection("jobs_partners")
    .aggregate<{ _id: string; active: number; removed: number }>([
      { $match: activeMatch },
      lookupInFlux,
      { $group: { _id: "$partner_label", active: { $sum: 1 }, removed: { $sum: { $cond: [isNewAbsence, 1, 0] } } } },
    ])
    .toArray()

  return stats.flatMap(({ _id: partner_label, active, removed }) => {
    const { maxRemovedCancellationRate, minRemovedCountToBlock } = getGuardrailThresholds(partner_label)
    const rate = removed / active
    return removed >= minRemovedCountToBlock && rate > maxRemovedCancellationRate ? [{ partner_label, active, removed, rate, maxRate: maxRemovedCancellationRate }] : []
  })
}

/**
 * Délai de grâce après un blocage : les offres sorties du flux sont datées et restent en ligne. Revenues dans le flux,
 * elles perdent leur date ; absentes au terme de REMOVAL_GRACE_DAYS, elles sont annulées par le run suivant.
 */
const holdNewAbsences = async (activeMatch: object, blocked: RemovalGuardBlock[], now: Date) => {
  const returned = await findIds({ $and: [activeMatch, { flux_absent_since: { $ne: null } }] }, { inFlux: true })
  if (returned.length) {
    await getDbCollection("jobs_partners").updateMany({ _id: { $in: returned } }, { $unset: { flux_absent_since: "" } })
  }
  if (!blocked.length) return
  const absent = await findIds(
    { $and: [activeMatch, { partner_label: { $in: blocked.map(({ partner_label }) => partner_label) } }, { flux_absent_since: null }] },
    { inFlux: false }
  )
  if (absent.length) {
    await getDbCollection("jobs_partners").updateMany({ _id: { $in: absent } }, { $set: { flux_absent_since: now } })
  }
}

export const formatRemovalGuardBlock = ({ partner_label, active, removed, rate, maxRate }: RemovalGuardBlock) =>
  `${partner_label} : ${removed} offres actives sur ${active} (${formatRate(rate)}) absentes du flux depuis le run précédent, seuil ${formatRate(maxRate)}. Elles restent en ligne et seront annulées dans ${REMOVAL_GRACE_DAYS} jours si elles ne reviennent pas dans le flux. Pour les annuler dès maintenant, après vérification : yarn cli forceCancelRemovedJobsPartners --partnerLabel "${partner_label}"`

/**
 * Annule les offres jobs_partners absentes (ou expirées) du flux source correspondant.
 *
 * IMPORTANT : `matchFilter` est obligatoire et ne doit jamais être vide. Un filtre vide
 * annulerait toutes les offres actives tous partenaires confondus. Cette fonction n'est donc
 * pas exposée en CLI : passer par les sous-jobs dédiés (cancelRemovedJobsPartnersFlux,
 * cancelRemovedJobsPartnersRecruteursLba, forceCancelRemovedJobsPartners) qui encapsulent leur filtre respectif.
 *
 * `removalGuard` : un partenaire dont les sorties du flux depuis le run précédent dépassent le seuil
 * (cf. getGuardrailThresholds) est renvoyé dans `blocked` et ces offres suivent le délai de grâce (cf. holdNewAbsences).
 * L'appelant fait échouer le job une fois le reste du traitement terminé. Sans `removalGuard`, toute offre absente est annulée.
 */
export const cancelRemovedJobsPartners = async (matchFilter: Filter<IComputedJobsPartners>, { removalGuard }: { removalGuard: boolean }) => {
  logger.info("début de cancelRemovedJobsPartners")

  if (!matchFilter || Object.keys(matchFilter).length === 0) {
    throw new Error("cancelRemovedJobsPartners: matchFilter is required and must not be empty")
  }

  const activeMatch = { $and: [matchFilter, { offer_status: JOB_STATUS_ENGLISH.ACTIVE }] }
  const matchStage = { $match: activeMatch }

  const now = new Date()
  const blocked = removalGuard ? await findRemovalGuardBlocks(activeMatch) : []
  for (const block of blocked) {
    await alertGuardrailBlock(`Annulation des offres ${block.partner_label}`, formatRemovalGuardBlock(block))
  }
  if (removalGuard) {
    await holdNewAbsences(activeMatch, blocked, now)
  }
  const graceCutoff = new Date(now.getTime() - REMOVAL_GRACE_DAYS * DAY_MS + RUN_START_JITTER_MS)
  const removalMatchStage = removalGuard
    ? {
        $match: {
          $and: [
            ...activeMatch.$and,
            {
              $or: [{ flux_absent_since: { $lte: graceCutoff } }, { flux_absent_since: null, partner_label: { $nin: blocked.map(({ partner_label }) => partner_label) } }],
            },
          ],
        },
      }
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
    lookupInFlux,
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
                // Le business_error du computed apparié : `matched` n'est retiré qu'au $unset suivant.
                reason: { $arrayElemAt: ["$matched.business_error", 0] },
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
