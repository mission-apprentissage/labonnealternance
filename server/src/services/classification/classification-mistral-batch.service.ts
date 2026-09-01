import { ObjectId } from "bson"
import { addJob } from "job-processor"
import type { AnyBulkWriteOperation, Filter } from "mongodb"
import type { IClassificationJobsPartners } from "shared/models/cache-classification.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import type { IMistralBatchJob } from "shared/models/mistral-batch-jobs.model"
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
 * Trois garde-fous, tirés de l'incident des 30–31/08/2026 (batch de 20 681 requêtes bloqué à
 * 99,4 % pendant plus de 24 h, catalogue partenaire à l'arrêt) :
 * - les soumissions sont découpées en lots indépendants (BATCH_CHUNK_SIZE), suivis séparément :
 *   une requête coincée ne bloque plus que son lot ;
 * - `timeout_hours` est court (CLASSIFICATION_BATCH_TIMEOUT_HOURS) et la ramasse applique la
 *   sortie de tout job terminal qui en a une, SUCCESS ou non — les résultats acquis servent, les
 *   requêtes manquantes restent CLASSIFICATION_PENDING et repartent au lot suivant ;
 * - le filet de sécurité (PENDING_TIMEOUT_MS) ne se contente plus de lever le marquage : il
 *   relance la chaîne de traitement sur les offres libérées, sinon celles qui ont un code ROME
 *   n'étaient reprises par personne avant la nuit suivante.
 */

const now = () => new Date()

/** Un batch de ~20 000 requêtes est otage de sa pire requête ; 2 000 borne le rayon d'un blocage. */
const BATCH_CHUNK_SIZE = 2_000

/** 10 batchs sur 12 mesurés en prod reviennent en moins de 70 min ; au-delà, mieux vaut récupérer
 * le partiel et resoumettre le reste que d'attendre le défaut Mistral de 24 h. */
const CLASSIFICATION_BATCH_TIMEOUT_HOURS = 2

const TERMINAL_STATUSES = new Set(["SUCCESS", "FAILED", "TIMEOUT_EXCEEDED", "CANCELLED"])

const BATCH_SYSTEM_PROMPT = `Tu classes une offre d'alternance transmise par un partenaire. Détecte si elle est publiée par un CFA ou un organisme de formation qui se présente LUI-MÊME comme l'employeur (CFA "déguisé"), qui doit être dépubliée.
Retourne :
- label: "unpublish" UNIQUEMENT si l'ANNONCEUR (les champs workplace_name/workplace_description, pas un tiers mentionné dans le texte) se présente lui-même comme un CFA/organisme de formation qui recrute pour SES PROPRES formations (vocabulaire "notre centre", "nos apprenants", nom d'établissement type CFA/GRETA/AFPA/CFPPA, "organisme de formation certifié", etc. appliqué à l'annonceur lui-même) ; "publish" sinon.
- Le simple fait que l'offre MENTIONNE un centre de formation partenaire (où se déroulera la formation théorique, mention légale du contrat d'apprentissage) est un cas NORMAL de toute offre d'alternance et NE DOIT PAS déclencher "unpublish" — seul le statut de l'ANNONCEUR/EMPLOYEUR compte, jamais celui d'un tiers cité dans le texte.
- Si le nom de l'employeur correspond à une entreprise reconnue dont l'activité principale n'est PAS la formation (banque, restauration collective, industrie, grande distribution, BTP, etc.), et que le mot "CFA"/"Académie"/"Formation" n'apparaît que dans le nom de marque de son propre dispositif de formation interne (ex. "CFA B-School by BNP Paribas", "CFA Académie by Elior"), ne classe PAS en "unpublish" : c'est l'entreprise elle-même qui recrute pour ses métiers via son alternance interne, pas un CFA externe déguisé en employeur.
- scores.publish et scores.unpublish : deux nombres entre 0 et 1, dont la somme fait 1.
Exemples :
- Employeur "BNP Paribas" (banque), titre "Bachelor Banque Assurance - CFA B-School By Bnp Paribas", description "Rejoignez notre Centre de Formation d'Apprentis B-School by BNP Paribas pour suivre un Bachelor..." → "publish" (BNP Paribas recrute pour son propre réseau bancaire ; "B-School"/"CFA" n'est que le nom de son dispositif d'alternance interne, pas un CFA externe qui se ferait passer pour l'employeur).
- Employeur "Elior" (restauration collective), titre "Apprenti Cuisinier (CFA Académie By Elior)" → "publish" (même logique : Elior recrute pour ses propres métiers de restauration via son académie interne).
- Employeur "CFA des Métiers du Bâtiment" (aucune activité commerciale reconnue derrière ce nom), offre "Assistant administratif", aucune entreprise d'accueil précise mentionnée → "unpublish" (ici c'est bien un centre de formation, sans lien avec une entreprise reconnue, qui recrute pour ses propres formations).
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

type ClassificationCandidate = { _id: ObjectId } & ClassificationSourceDoc

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

const submitOneChunk = async (docs: ClassificationCandidate[]): Promise<string | null> => {
  const requests = docs.map((doc) => ({ customId: doc._id.toString(), messages: buildBatchMessages(doc) }))
  const jobId = await submitMistralBatch({
    requests,
    model: CLASSIFICATION_MISTRAL_MODEL,
    timeoutHours: CLASSIFICATION_BATCH_TIMEOUT_HOURS,
    inputFileName: `jobs_partners_classification_${now().getTime()}.jsonl`,
  })

  if (!jobId) {
    logger.error(`submitClassificationRequests: échec de soumission (${requests.length} requêtes) — les offres restent CLASSIFICATION_PENDING, débloquées par le filet de sécurité`)
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
    logger.error(`submitClassificationRequests: job ${jobId} soumis mais suivi non enregistré`)
  }

  logger.info(`submitClassificationRequests: ${requests.length} offre(s) soumise(s) au batch Mistral (job ${jobId})`)
  return jobId
}

/** Soumet directement des documents déjà chargés (évite un second aller-retour Mongo quand
 * l'appelant les a déjà en main — ex. le routage sync/batch de detectClassificationJobsPartners,
 * qui a besoin des mêmes champs pour compter les candidats avant de décider de la bascule).
 * Découpe en lots indépendants ; retourne les ids des jobs effectivement créés. */
export const submitClassificationRequests = async (docs: ClassificationCandidate[], { chunkSize = BATCH_CHUNK_SIZE }: { chunkSize?: number } = {}): Promise<string[]> => {
  if (!docs.length) return []
  const jobIds: string[] = []
  let failedDocs = 0
  for (const part of chunk(docs, chunkSize)) {
    const jobId = await submitOneChunk(part)
    if (jobId) jobIds.push(jobId)
    else failedDocs += part.length
  }
  if (jobIds.length > 1) {
    logger.info(`submitClassificationRequests: ${docs.length} offre(s) réparties sur ${jobIds.length} batch(s) de ${chunkSize} max`)
  }
  if (failedDocs) {
    // Symétrique de l'alerte sur job terminal en échec : ces offres restent CLASSIFICATION_PENDING
    // six heures avant que le filet ne les relance, autant le savoir tout de suite.
    await notifyToSlack({
      subject: "Batch Mistral classification jobs_partners : soumission en échec",
      message: `${failedDocs} offre(s) n'ont pu être soumises à Mistral (${jobIds.length} lot(s) soumis avec succès). Elles restent CLASSIFICATION_PENDING jusqu'au filet de sécurité, qui relancera leur traitement.`,
      error: true,
    })
  }
  return jobIds
}

/** Soumet un batch Mistral (fire-and-forget, suivi dans mistral_batch_jobs) pour les
 * computed_jobs_partners matchant `filter` — usage manuel (backfill/rattrapage via addJob). Le
 * routage automatique de detectClassificationJobsPartners appelle submitClassificationRequests
 * directement avec les documents déjà chargés, pour ne pas les refetcher ici. */
export const submitClassificationBatch = async (filter: Filter<IComputedJobsPartners>): Promise<string[]> => {
  const docs = await getDbCollection("computed_jobs_partners").find(filter, { projection: CLASSIFICATION_PROJECTION }).toArray()
  return submitClassificationRequests(docs)
}

// Largement au-dessus d'une durée normale de batch (souvent quelques minutes à heures) : sert de
// filet de sécurité pour débloquer une offre dont le suivi a été perdu ou dont le job a échoué,
// sans avoir besoin de retrouver précisément quel job batch la couvrait.
const PENDING_TIMEOUT_MS = 6 * 60 * 60 * 1000

/** Relance la chaîne de traitement (fill → validation → import) sur des computed précis. Passe
 * par addJob (nom enregistré dans simple-job-definitions.ts) plutôt qu'un import direct, pour ne
 * pas créer de cycle avec detectClassificationJobsPartners (qui importe ce module).
 * `queued: true` : sans lui, addJob exécute le job inline dans la ramasse horaire — un run de
 * 14 min mesuré en prod le 28/08 — et le cron, sans maxRuntimeInMinutes explicite, est tué au
 * bout de 60 min s'il cumule plusieurs lots plus le filet. Le worker prend le relais en quelques
 * secondes, comme pour updateClassificationAndSynchronise. */
const requeueProcessing = async (ids: ObjectId[]) => {
  if (!ids.length) return
  await addJob({ name: "processJobPartnersWithFilter", payload: { _id: { $in: ids } }, queued: true })
}

const releaseStuckPendingClassifications = async () => {
  const staleBefore = new Date(Date.now() - PENDING_TIMEOUT_MS)
  const staleFilter = { business_error: JOB_PARTNER_BUSINESS_ERROR.CLASSIFICATION_PENDING, updated_at: { $lt: staleBefore } }
  const stuck = await getDbCollection("computed_jobs_partners")
    .find(staleFilter, { projection: { _id: 1 } })
    .toArray()
  if (!stuck.length) return 0

  const ids = stuck.map((doc) => doc._id)
  await getDbCollection("computed_jobs_partners").updateMany(
    { _id: { $in: ids } },
    { $set: { business_error: null, updated_at: now() }, $pull: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION } }
  )
  logger.warn(
    `releaseStuckPendingClassifications: ${ids.length} offre(s) débloquée(s) après plus de ${PENDING_TIMEOUT_MS / 3_600_000}h en CLASSIFICATION_PENDING — chaîne de traitement relancée`
  )
  // Sans cette relance, une offre libérée mais déjà dotée d'un code ROME n'était reprise par aucun
  // job avant la nuit suivante (processMissingRome ne prend que les sans-ROME) : 16 147 offres
  // Hellowork et France Travail bloquées ainsi en prod le 01/09/2026. Au retraitement, les offres
  // déjà classées sont servies par cache_classification ; seules les inconnues repartent.
  await requeueProcessing(ids)
  return ids.length
}

type ApplyOutcome = { applied: number; requested: number }

/** Télécharge la sortie d'un job Mistral et l'applique aux computed correspondants (cache +
 * business_error + jobs_in_success), puis relance la chaîne de traitement sur ces offres. Les
 * requêtes absentes de la sortie (job partiel) ne sont pas touchées : elles restent
 * CLASSIFICATION_PENDING et seront libérées par le filet de sécurité. */
const applyBatchOutput = async (outputFile: string, requestCount: number): Promise<ApplyOutcome> => {
  const outputs = await downloadMistralBatchOutput(outputFile)

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
          // $addToSet (pas $pull) : la classification a réellement été obtenue, comme le
          // chemin sync (fillFieldsForComputedPartnersFactory) qui pousse CLASSIFICATION
          // dans jobs_in_success sur tout succès quel que soit le label. Un $pull laisserait
          // les offres "publish" (business_error: null) éligibles au filtre de candidature
          // de detectClassificationJobsPartners re-déclenché juste après par
          // processJobPartnersWithFilter → boucle de resoumission Mistral à chaque ramasse.
          $addToSet: { jobs_in_success: COMPUTED_ERROR_SOURCE.CLASSIFICATION },
        },
      },
    })
    appliedIds.push(doc._id)
  }

  if (cacheOps.length) await getDbCollection("cache_classification").bulkWrite(cacheOps, { ordered: false })
  if (computedOps.length) await getDbCollection("computed_jobs_partners").bulkWrite(computedOps, { ordered: false })
  await requeueProcessing(appliedIds)

  return { applied: appliedIds.length, requested: requestCount }
}

type BatchCheckResult = "applied" | "stillRunning" | "failed"

/**
 * Vérifie un job suivi et agit selon son état Mistral :
 * - une sortie existe et le job est terminal (ou `force`) → application, statut `applied`, `error`
 *   renseigné si le statut Mistral n'est pas SUCCESS (application partielle tracée) ;
 * - terminal sans sortie → `failed` + alerte, les offres restent PENDING jusqu'au filet ;
 * - sinon → on repassera.
 */
const checkAndApplyTrackedJob = async (tracked: IMistralBatchJob, { force = false }: { force?: boolean } = {}): Promise<BatchCheckResult> => {
  const job = await getMistralBatchJob(tracked.job_id)
  const isTerminal = TERMINAL_STATUSES.has(job.status)

  if (job.outputFile && (isTerminal || force)) {
    const { applied, requested } = await applyBatchOutput(job.outputFile, tracked.request_count)
    const appliedAt = now()
    const partial = job.status !== "SUCCESS" || applied < requested
    // `error` trace le partiel en base même en SUCCESS (réponses absentes ou inexploitables) :
    // applied_count < request_count seul ne dit pas si l'écart était attendu.
    const error = !partial ? null : job.status === "SUCCESS" ? `PARTIAL ${applied}/${requested}` : job.status
    await getDbCollection("mistral_batch_jobs").updateOne(
      { _id: tracked._id },
      { $set: { status: "applied", applied_count: applied, applied_at: appliedAt, checked_at: appliedAt, error } }
    )
    logger.info(`applyPendingClassificationBatches: job ${tracked.job_id} appliqué (${applied}/${requested} réponses, statut Mistral ${job.status})`)
    if (partial) {
      await notifyToSlack({
        subject: "Batch Mistral classification jobs_partners appliqué partiellement",
        message: `Job ${tracked.job_id} en ${job.status} : ${applied}/${requested} réponses appliquées. Les offres manquantes restent CLASSIFICATION_PENDING et seront relancées par le filet de sécurité.`,
        error: false,
      })
    }
    return "applied"
  }

  if (isTerminal) {
    await getDbCollection("mistral_batch_jobs").updateOne({ _id: tracked._id }, { $set: { status: "failed", error: job.status, checked_at: now() } })
    await notifyToSlack({
      subject: "Batch Mistral classification jobs_partners en échec",
      message: `Le job batch ${tracked.job_id} (${tracked.request_count} requêtes) est terminé en ${job.status} sans fichier de sortie — les offres concernées restent bloquées (CLASSIFICATION_PENDING) jusqu'au filet de sécurité, qui relancera leur traitement.`,
      error: true,
    })
    return "failed"
  }

  // QUEUED / RUNNING / … : on repassera.
  await getDbCollection("mistral_batch_jobs").updateOne({ _id: tracked._id }, { $set: { checked_at: now() } })
  return "stillRunning"
}

/** Cron de ramasse (horaire) : débloque les offres restées pendantes trop longtemps (et relance
 * leur traitement), puis télécharge et applique la sortie des jobs batch terminés. Reprise
 * garantie à travers les redéploiements — tout job soumis finit ramassé ou expiré par le filet. */
export const applyPendingClassificationBatches = async () => {
  await releaseStuckPendingClassifications()

  const pendingJobs = await getDbCollection("mistral_batch_jobs").find({ status: "submitted", kind: "jobs_partners_classification" }).toArray()
  const counters = { applied: 0, stillRunning: 0, failed: 0 }

  for (const pending of pendingJobs) {
    try {
      counters[await checkAndApplyTrackedJob(pending)]++
    } catch (err) {
      sentryCaptureException(err)
    }
  }

  if (pendingJobs.length) {
    logger.info(`applyPendingClassificationBatches: ${counters.applied} appliqués, ${counters.stillRunning} en cours, ${counters.failed} en échec (${pendingJobs.length} suivis)`)
  }
  return counters
}

/**
 * Levier d'incident (`yarn cli applyClassificationBatch --jobId <id>`) : applique la sortie d'un
 * job Mistral précis dès qu'elle existe, quel que soit son statut Mistral et l'état de son suivi
 * — y compris un job jamais enregistré dans mistral_batch_jobs (soumission interrompue) ou déjà
 * marqué `failed` par la ramasse. Sans sortie disponible, ne touche à rien et le dit.
 */
export const applyClassificationBatch = async (payload?: { jobId?: string }) => {
  const jobId = payload?.jobId?.trim()
  if (!jobId) {
    throw new Error("applyClassificationBatch: --jobId requis (identifiant du job batch Mistral)")
  }

  const job = await getMistralBatchJob(jobId)
  const existing = await getDbCollection("mistral_batch_jobs").findOne({ job_id: jobId })
  // Un job jamais suivi (soumission interrompue) n'a pas de request_count en base : on le prend
  // chez Mistral pour que applied_count reste comparable à request_count.
  const requestCount = existing?.request_count || job.totalRequests || 0
  const tracked: IMistralBatchJob = existing ?? {
    _id: new ObjectId(),
    job_id: jobId,
    kind: "jobs_partners_classification",
    status: "submitted",
    request_count: requestCount,
    applied_count: null,
    error: null,
    submitted_at: now(),
    checked_at: null,
    applied_at: null,
  }
  if (!existing) {
    await getDbCollection("mistral_batch_jobs").insertOne(tracked)
    logger.warn(`applyClassificationBatch: job ${jobId} non suivi jusqu'ici, suivi créé`)
  }

  if (!job.outputFile) {
    logger.warn(`applyClassificationBatch: job ${jobId} en ${job.status}, aucun fichier de sortie disponible — rien appliqué`)
    return { status: job.status, applied: 0, requested: requestCount }
  }

  await checkAndApplyTrackedJob({ ...tracked, request_count: requestCount }, { force: true })
  const updated = await getDbCollection("mistral_batch_jobs").findOne({ job_id: jobId })
  return { status: job.status, applied: updated?.applied_count ?? 0, requested: requestCount }
}
