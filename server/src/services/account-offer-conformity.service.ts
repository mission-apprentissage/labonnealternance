import type { Filter, ObjectId } from "mongodb"
import { CFA, ENTREPRISE } from "shared/constants/recruteur"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IAccountOfferConformity } from "shared/models/jobs-partners-moderation.model"
import { ACCOUNT_OFFER_CONFORMITIES, MODERATION_REVIEW_STATUS, OFFER_MODERATION_STATUS } from "shared/models/jobs-partners-moderation.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

/** Un utilisateur sur une entreprise, ou sur un CFA pour les offres qu'il dépose au nom de ses entreprises partenaires. */
export type IConformityAccount = { userId: ObjectId; type: typeof ENTREPRISE | typeof CFA; siret: string | null | undefined }

const OPEN_STATUSES = [JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.EN_MODERATION, JOB_STATUS_ENGLISH.ACTIVE]

const rank = (conformity: IAccountOfferConformity) => ACCOUNT_OFFER_CONFORMITIES.indexOf(conformity)

/** Offre jamais analysée, en expression d'agrégation : ni verdict ni statut d'analyse (cf. ConformityBadge). */
export const IS_NEVER_CLASSIFIED_EXPR = {
  $or: [{ $eq: [{ $ifNull: ["$offer_moderation_verdict", null] }, null] }, { $eq: [{ $ifNull: ["$offer_moderation_status", null] }, null] }],
}

// Une offre validée par un modérateur compte comme conforme. Le statut de l'analyse passe avant le verdict, qui vaut
// `a_verifier` en cas d'échec.
const OFFER_RANK = {
  $switch: {
    branches: [
      { case: { $eq: ["$offer_moderation_review", MODERATION_REVIEW_STATUS.VALIDEE] }, then: rank("conforme") },
      { case: IS_NEVER_CLASSIFIED_EXPR, then: rank("non_applicable") },
      { case: { $ne: ["$offer_moderation_status", OFFER_MODERATION_STATUS.OK] }, then: rank("indisponible") },
      { case: { $eq: ["$offer_moderation_verdict", "non_conforme"] }, then: rank("non_conforme") },
      { case: { $eq: ["$offer_moderation_verdict", "a_verifier"] }, then: rank("a_verifier") },
    ],
    default: rank("conforme"),
  },
}

const accountKey = (userId: ObjectId, type: IConformityAccount["type"], siret: string | null | undefined) => `${userId.toString()}|${type}|${siret ?? ""}`

/**
 * Conformité de chaque compte, dans l'ordre reçu : celle de sa pire offre LBA non close, « non applicable » si aucune
 * n'a été analysée, « aucune offre » sans offre non close (#5757). Une seule agrégation, qui ne lit aucun texte d'offre.
 * `scope` restreint les offres comptées, au périmètre d'un OPCO par exemple.
 */
export const getAccountOfferConformities = async (accounts: IConformityAccount[], scope: Filter<IJobsPartnersOfferPrivate> = {}): Promise<IAccountOfferConformity[]> => {
  if (!accounts.length) return []
  const userIds = [...new Map(accounts.map(({ userId }) => [userId.toString(), userId])).values()]
  const groups = await getDbCollection("jobs_partners")
    .aggregate<{ _id: { user: ObjectId; delegated: boolean; siret: string | null }; rank: number }>([
      { $match: { $and: [{ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, managed_by: { $in: userIds }, offer_status: { $in: OPEN_STATUSES } }, scope] } },
      {
        $group: {
          _id: {
            user: "$managed_by",
            delegated: { $eq: ["$is_delegated", true] },
            siret: { $cond: [{ $eq: ["$is_delegated", true] }, "$cfa_siret", "$workplace_siret"] },
          },
          rank: { $min: OFFER_RANK },
        },
      },
    ])
    .toArray()
  const ranks = new Map(groups.map(({ _id, rank }) => [accountKey(_id.user, _id.delegated ? CFA : ENTREPRISE, _id.siret), rank]))
  return accounts.map(({ userId, type, siret }) => {
    const accountRank = ranks.get(accountKey(userId, type, siret))
    return accountRank === undefined ? "aucune_offre" : ACCOUNT_OFFER_CONFORMITIES[accountRank]
  })
}
