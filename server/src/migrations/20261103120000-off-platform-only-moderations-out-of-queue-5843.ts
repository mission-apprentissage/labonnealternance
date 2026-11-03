import type { ObjectId } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

// Figés ici : la migration doit garder son effet si MODERATION_TRACE_ONLY_CATEGORIES ou SOCIAL_HANDLE évoluent.
const TRACE_ONLY_CATEGORIES = ["candidature_hors_plateforme"]
const SOCIAL_HANDLE = /(?:^|[\s:(])@[\w.]{2,}/

type IFinding = { category: string; verbatim: string | null }

// Un pseudo de réseau social reste un contournement (cf. reconcileContactCategory) ; un extrait purgé ne se vérifie plus.
const isTraceOnly = ({ category, verbatim }: IFinding) => TRACE_ONLY_CATEGORIES.includes(category) && verbatim !== null && !SOCIAL_HANDLE.test(verbatim)

/**
 * Sort de la file de revue les offres « à vérifier » dont la dernière classification ne relève que la candidature hors
 * plateforme, qui ne compte plus dans le verdict (#5843). Seul le verdict dénormalisé sur l'offre change : la
 * classification garde le verdict calculé à l'époque, avec sa version de prompt. Ce verdict ne bloquait pas : le
 * statut de l'offre est inchangé. Une offre dont un extrait contient un pseudo de réseau social reste en file.
 *
 * `bypassDocumentValidation` : des offres anciennes ne respectent pas le schéma actuel.
 */
export const up = async () => {
  const queueFilter = {
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    offer_moderation_verdict: "a_verifier",
    offer_moderation_status: "ok",
    offer_moderation_review: null,
  } as const

  const candidates = await getDbCollection("jobs_partners")
    .aggregate<{ _id: ObjectId; latest: { status: string; findings: IFinding[] }[] }>([
      { $match: queueFilter },
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
    { ...queueFilter, _id: { $in: jobIds } },
    { $set: { offer_moderation_verdict: "conforme" } },
    { bypassDocumentValidation: true }
  )
  logger.info(`modération #5843 : ${modifiedCount} offres sorties de la file (candidature hors plateforme seule) sur ${candidates.length} à vérifier`)
}

export const requireShutdown: boolean = false
