import type { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

// Figés ici, à l'identique de la migration 20261103120000 : cf. ses commentaires.
const TRACE_ONLY_CATEGORIES = ["candidature_hors_plateforme"]
const SOCIAL_HANDLE = /(?:^|[\s:(])@[\w.]{2,}/

type IFinding = { category: string; verbatim: string | null }

const isTraceOnly = ({ category, verbatim }: IFinding) => TRACE_ONLY_CATEGORIES.includes(category) && verbatim !== null && !SOCIAL_HANDLE.test(verbatim)

/**
 * Étend la migration 20261103120000 (#5843) aux offres `Pending` d'un compte en attente de validation : à la validation,
 * elles passent `Active` sans nouvelle classification (cf. checkForJobActivations) et leur verdict « à vérifier » les
 * amènerait dans la file. `Active` et `InReview` sont repris pour les offres publiées depuis le passage de la première
 * migration ; celles qu'elle a déjà sorties de la file n'ont plus le verdict `a_verifier`.
 *
 * `bypassDocumentValidation` : des offres anciennes ne respectent pas le schéma actuel.
 */
export const up = async () => {
  const candidateFilter = {
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    offer_status: { $in: [JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.ACTIVE, JOB_STATUS_ENGLISH.EN_MODERATION] },
    offer_moderation_verdict: "a_verifier",
    offer_moderation_status: "ok",
    offer_moderation_review: null,
  } as const

  const candidates = await getDbCollection("jobs_partners")
    .aggregate<{ _id: ObjectId; latest: { status: string; findings: IFinding[] }[] }>([
      { $match: candidateFilter },
      {
        $lookup: {
          from: "jobs_partners_moderations",
          localField: "_id",
          foreignField: "job_id",
          pipeline: [{ $sort: { created_at: -1 } }, { $limit: 1 }, { $project: { status: 1, findings: 1 } }],
          as: "latest",
        },
      },
      { $project: { latest: 1 } },
    ])
    .toArray()

  const jobIds = candidates
    .filter(({ latest: [moderation] }) => moderation?.status === "ok" && moderation.findings.length > 0 && moderation.findings.every(isTraceOnly))
    .map(({ _id }) => _id)

  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    { ...candidateFilter, _id: { $in: jobIds } },
    { $set: { offer_moderation_verdict: "conforme" } },
    { bypassDocumentValidation: true }
  )
  logger.info(`modération #5843 : ${modifiedCount} offres en attente ou publiées passées conformes (candidature hors plateforme seule) sur ${candidates.length} à vérifier`)
}

export const requireShutdown: boolean = false
