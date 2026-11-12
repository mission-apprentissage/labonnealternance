import type { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

// Figés ici, à l'identique de la migration 20261103120000 : cf. ses commentaires.
const TRACE_ONLY_CATEGORIES = ["candidature_hors_plateforme"]
const SOCIAL_HANDLE = /(?:^|[\s:(])@[\w.]{2,}/

const STATUSES = [JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.ACTIVE] as const

type IFinding = { category: string; verbatim: string | null }

const isTraceOnly = ({ category, verbatim }: IFinding) => TRACE_ONLY_CATEGORIES.includes(category) && verbatim !== null && !SOCIAL_HANDLE.test(verbatim)

/**
 * Étend la migration 20261103120000 (#5843) aux offres `Pending` d'un compte en attente de validation : à la validation,
 * elles passent `Active` sans nouvelle classification (cf. checkForJobActivations) et leur verdict « à vérifier » les
 * amènerait dans la file. `Active` est repris pour les offres publiées depuis le passage de la première migration ;
 * celles qu'elle a déjà sorties de la file n'ont plus le verdict `a_verifier`. `InReview` est exclu : passée `conforme`
 * sans être publiée (cf. releaseOfferInReview), une offre en modération sortirait de la file et resterait masquée. Une
 * offre close réactivée par un admin garde aussi son verdict : action manuelle, hors périmètre.
 *
 * `bypassDocumentValidation` : des offres anciennes ne respectent pas le schéma actuel.
 */
export const up = async () => {
  const candidateFilter = {
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    offer_status: { $in: STATUSES },
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

  const modified: string[] = []
  for (const offer_status of STATUSES) {
    const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
      { ...candidateFilter, offer_status, _id: { $in: jobIds } },
      { $set: { offer_moderation_verdict: "conforme" } },
      { bypassDocumentValidation: true }
    )
    modified.push(`${modifiedCount} ${offer_status}`)
  }
  logger.info(`modération #5843 : offres passées conformes (candidature hors plateforme seule) : ${modified.join(", ")}, sur ${candidates.length} à vérifier`)
}

export const requireShutdown: boolean = false
