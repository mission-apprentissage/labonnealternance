import { ObjectId } from "bson"
import { addJob } from "job-processor"
import type { AnyBulkWriteOperation, Filter } from "mongodb"
import type { IClassificationJobsPartners } from "shared/models/cache-classification.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { z } from "zod"
import { CLASSIFICATION_MISTRAL_MODEL } from "@/common/apis/classification/classification-mistral.client"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import type { Message } from "@/services/mistralai/mistralai.service"
import { downloadMistralBatchOutput, getMistralBatchJob, submitMistralBatch } from "@/services/mistralai/mistralai.service"

/**
 * Mode batch de la classification jobs_partners (~50% moins cher que le mode sync, mais
 * asynchrone) : réservé aux pics de volume détectés par detectClassificationJobsPartners
 * (import massif, rattrapage) — jamais le flux organique, qui reste sync pour ne pas retarder
 * la publication. `customId` = `_id` de computed_jobs_partners (un document par requête, pas de
 * regroupement par 50 comme en sync : on doit retrouver le document précis à débloquer).
 *
 * Filet de sécurité : toute offre restée `CLASSIFICATION_PENDING` plus de PENDING_TIMEOUT_MS est
 * débloquée par `applyPendingClassificationBatches`, indépendamment du suivi du job batch — couvre
 * aussi bien un job jamais enregistré (soumis mais insertOne échoué) qu'un job en échec terminal.
 */

const now = () => new Date()

const BATCH_SYSTEM_PROMPT = `Tu classes une offre d'alternance transmise par un partenaire. Détecte si elle est publiée par un CFA ou un organisme de formation se présentant comme un employeur (CFA "déguisé"), qui doit être dépubliée.
Retourne :
- label: "unpublish" si l'annonceur est manifestement un CFA/organisme de formation qui recrute pour ses propres formations (vocabulaire "notre centre", "nos apprenants", nom d'établissement type CFA/GRETA/AFPA/CFPPA, etc.) ; "publish" sinon.
- scores.publish et scores.unpublish : deux nombres entre 0 et 1, dont la somme fait 1.
Ignore le HTML.
Réponds STRICTEMENT en JSON : {"label": "publish"|"unpublish", "scores": {"publish": 0.0, "unpublish": 0.0}}`

type ClassificationSourceDoc = {
  workplace_name?: string | null
  workplace_description?: string | null
  offer_title?: string | null
  offer_description?: string | null
}

const buildBatchMessages = (job: ClassificationSourceDoc): Message[] => [
  { role: "system", content: BATCH_SYSTEM_PROMPT },
  {
    role: "user",
    content: JSON.stringify({
      workplace_name: job.workplace_name ?? undefined,
      workplace_description: job.workplace_description ?? undefined,
      offer_title: job.offer_title ?? undefined,
      offer_description: job.offer_description ?? undefined,
    }),
  },
]

const ZBatchClassificationContent = z.object({
  label: z.enum(["publish", "unpublish"]),
  scores: z.object({ publish: z.number(), unpublish: z.number() }),
})

const parseBatchClassificationContent = (content: string): z.output<typeof ZBatchClassificationContent> | null => {
  try {
    const validation = ZBatchClassificationContent.safeParse(JSON.parse(content))
    return validation.success ? validation.data : null
  } catch {
    return null
  }
}

const CLASSIFICATION_PROJECTION = { _id: 1, workplace_name: 1, workplace_description: 1, offer_title: 1, offer_description: 1 } as const

/** Soumet un batch Mistral (fire-and-forget, suivi dans mistral_batch_jobs) pour les
 * computed_jobs_partners matchant `filter` — appelé automatiquement par detectClassificationJobsPartners
 * au-delà du seuil sync, ou manuellement (backfill/rattrapage) via addJob. */
export const submitClassificationBatch = async (filter: Filter<IComputedJobsPartners>): Promise<string | null> => {
  const docs = await getDbCollection("computed_jobs_partners").find(filter, { projection: CLASSIFICATION_PROJECTION }).toArray()
  if (!docs.length) return null

  const requests = docs.map((doc) => ({ customId: doc._id.toString(), messages: buildBatchMessages(doc) }))
  const jobId = await submitMistralBatch({ requests, model: CLASSIFICATION_MISTRAL_MODEL, inputFileName: `jobs_partners_classification_${now().getTime()}.jsonl` })

  if (!jobId) {
    logger.error(`submitClassificationBatch: échec de soumission (${requests.length} requêtes) — les offres restent CLASSIFICATION_PENDING, débloquées par le filet de sécurité`)
    return null
  }

  try {
    await getDbCollection("mistral_batch_jobs").insertOne({
      _id: new ObjectId(),
      job_id: jobId,
      kind: "jobs_partners_classification",
      status: "submitted",
      request_count: requests.length,
      applied_count: null,
      error: null,
      submitted_at: now(),
      checked_at: null,
      applied_at: null,
    })
  } catch (err) {
    // Job soumis (facturé) mais suivi non enregistré : le filet de sécurité (PENDING_TIMEOUT_MS)
    // débloquera les offres concernées même sans ramasse possible pour ce job précis.
    sentryCaptureException(err)
    logger.error(`submitClassificationBatch: job ${jobId} soumis mais suivi non enregistré`)
  }

  logger.info(`submitClassificationBatch: ${requests.length} offre(s) soumise(s) au batch Mistral (job ${jobId})`)
  return jobId
}

// Largement au-dessus d'une durée normale de batch (souvent quelques minutes à heures) : sert de
// filet de sécurité pour débloquer une offre dont le suivi a été perdu ou dont le job a échoué,
// sans avoir besoin de retrouver précisément quel job batch la couvrait.
const PENDING_TIMEOUT_MS = 6 * 60 * 60 * 1000

const releaseStuckPendingClassifications = async () => {
  const staleBefore = new Date(Date.now() - PENDING_TIMEOUT_MS)
  const result = await getDbCollection("computed_jobs_partners").updateMany(
    { business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: { $lt: staleBefore } },
    { $set: { business_error: null, updated_at: now() }, $pull: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION } }
  )
  if (result.modifiedCount) {
    logger.warn(`releaseStuckPendingClassifications: ${result.modifiedCount} offre(s) débloquée(s) après plus de ${PENDING_TIMEOUT_MS / 3_600_000}h en CLASSIFICATION_PENDING`)
  }
  return result.modifiedCount
}

/** Cron de ramasse (horaire) : débloque les offres restées pendantes trop longtemps, puis
 * télécharge et applique la sortie des jobs batch terminés. Reprise garantie à travers les
 * redéploiements — tout job soumis finit ramassé ou expiré par le filet de sécurité. */
export const applyPendingClassificationBatches = async () => {
  await releaseStuckPendingClassifications()

  const pendingJobs = await getDbCollection("mistral_batch_jobs").find({ status: "submitted", kind: "jobs_partners_classification" }).toArray()
  const counters = { applied: 0, stillRunning: 0, failed: 0 }

  for (const pending of pendingJobs) {
    try {
      const job = await getMistralBatchJob(pending.job_id)

      if (job.status === "SUCCESS" && job.outputFile) {
        const outputs = await downloadMistralBatchOutput(job.outputFile)

        const parsedByDocId = new Map<string, z.output<typeof ZBatchClassificationContent>>()
        for (const [customId, content] of outputs) {
          const parsed = parseBatchClassificationContent(content)
          if (!parsed || !/^[0-9a-f]{24}$/i.test(customId)) continue
          parsedByDocId.set(customId, parsed)
        }

        const docIds = [...parsedByDocId.keys()].map((id) => new ObjectId(id))
        const docs = docIds.length
          ? await getDbCollection("computed_jobs_partners")
              .find({ _id: { $in: docIds } }, { projection: { partner_label: 1, partner_job_id: 1 } })
              .toArray()
          : []

        const cacheOps: AnyBulkWriteOperation<IClassificationJobsPartners>[] = []
        const computedOps: AnyBulkWriteOperation<IComputedJobsPartners>[] = []
        const appliedIds: ObjectId[] = []
        const appliedAt = now()

        for (const doc of docs) {
          const parsed = parsedByDocId.get(doc._id.toString())
          if (!parsed) continue

          cacheOps.push({
            updateOne: {
              filter: { partner_label: doc.partner_label, partner_job_id: doc.partner_job_id },
              update: {
                $set: { classification: parsed.label, scores: parsed.scores, model: `mistral:${CLASSIFICATION_MISTRAL_MODEL}`, created_at: appliedAt },
                $setOnInsert: { _id: new ObjectId() },
              },
              upsert: true,
            },
          })
          computedOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: {
                $set: { business_error: parsed.label === "unpublish" ? JOB_PARTNER_BUSINESS_ERROR.CFA : null, updated_at: appliedAt },
                $pull: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION },
              },
            },
          })
          appliedIds.push(doc._id)
        }

        if (cacheOps.length) await getDbCollection("cache_classification").bulkWrite(cacheOps, { ordered: false })
        if (computedOps.length) await getDbCollection("computed_jobs_partners").bulkWrite(computedOps, { ordered: false })
        if (appliedIds.length) {
          // Ré-exécute la chaîne de traitement (validation + import vers jobs_partners) pour les
          // seules offres concernées, business_error déjà recalculé ci-dessus. Passe par addJob
          // (nom enregistré dans simple-job-definitions.ts) plutôt qu'un import direct, pour ne pas
          // créer de cycle avec detectClassificationJobsPartners (qui importe ce module).
          await addJob({ name: "processJobPartnersWithFilter", payload: { _id: { $in: appliedIds } } })
        }

        await getDbCollection("mistral_batch_jobs").updateOne(
          { _id: pending._id },
          { $set: { status: "applied", applied_count: appliedIds.length, applied_at: appliedAt, checked_at: appliedAt } }
        )
        counters.applied++
        logger.info(`applyPendingClassificationBatches: job ${pending.job_id} appliqué (${appliedIds.length}/${pending.request_count} réponses)`)
        continue
      }

      if (["FAILED", "TIMEOUT_EXCEEDED", "CANCELLED"].includes(job.status) || (job.status === "SUCCESS" && !job.outputFile)) {
        await getDbCollection("mistral_batch_jobs").updateOne({ _id: pending._id }, { $set: { status: "failed", error: job.status, checked_at: now() } })
        counters.failed++
        await notifyToSlack({
          subject: "Batch Mistral classification jobs_partners en échec",
          message: `Le job batch ${pending.job_id} (${pending.request_count} requêtes) est terminé en ${job.status} — les offres concernées restent bloquées (CLASSIFICATION_PENDING) jusqu'au filet de sécurité.`,
          error: true,
        })
        continue
      }

      // QUEUED / RUNNING / … : on repassera.
      await getDbCollection("mistral_batch_jobs").updateOne({ _id: pending._id }, { $set: { checked_at: now() } })
      counters.stillRunning++
    } catch (err) {
      sentryCaptureException(err)
    }
  }

  if (pendingJobs.length) {
    logger.info(`applyPendingClassificationBatches: ${counters.applied} appliqués, ${counters.stillRunning} en cours, ${counters.failed} en échec (${pendingJobs.length} suivis)`)
  }
  return counters
}
