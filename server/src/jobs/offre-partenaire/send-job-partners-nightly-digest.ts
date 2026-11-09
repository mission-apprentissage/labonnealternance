import type { IJobsCronTask } from "job-processor"
import { findJobs } from "job-processor"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { notifyToSlack, SLACK_MESSAGE_MAX_LENGTH, splitSlackMessage } from "@/common/utils/slack-utils"
import { importers } from "./jobs-partners.importer"
import type { GuardrailBlock } from "./jobs-partners-guardrails"
import { GUARDRAIL_ERROR_MARKER, getLatestGuardrailBlocks } from "./jobs-partners-guardrails"
import { buildPartnerNightlyTable, REMOVAL_GUARDRAIL_ALERT_PREFIX } from "./partner-publication-report"

const DIGEST_WINDOW_HOURS = 24

export const JOB_PARTNERS_DIGEST_JOB_NAME = "Bilan nocturne offres partenaires"

// Jobs de la pipeline jobs_partners enregistrés directement dans jobs.ts, donc absents du map
// `importers` ci-dessous mais dont le digest doit quand même surveiller les anomalies.
const ADDITIONAL_MONITORED_JOB_NAMES = ["Traitement des recruteur LBA par la pipeline jobs partners"]

// Calculé à l'appel (pas au chargement du module) : jobs-partners.importer.ts importe ce fichier pour enregistrer
// son propre CronDef, donc `importers` n'est pas encore initialisé tant que ce module est en cours de chargement.
const getJobPartnersNightlyJobNames = () => [...new Set([...Object.keys(importers), ...ADDITIONAL_MONITORED_JOB_NAMES])].filter((name) => name !== JOB_PARTNERS_DIGEST_JOB_NAME)

type ErrorSignal = { path: string; detail: string }

// Parcourt récursivement un résultat de job (souvent imbriqué : { filled: { step1: {total,success,error}, ... } })
// et n'en extrait que les champs *error* non nuls, avec leur chemin et leur total : le JSON complet
// est illisible sur Slack.
const findErrorSignals = (value: unknown, path: string[] = []): ErrorSignal[] => {
  if (value == null || typeof value !== "object") return []
  if (Array.isArray(value)) return value.flatMap((item, i) => findErrorSignals(item, [...path, String(i)]))

  const record = value as Record<string, unknown>
  const signals: ErrorSignal[] = []

  for (const [key, val] of Object.entries(record)) {
    if (/error/i.test(key)) {
      if (typeof val === "number" && val > 0) {
        const total = typeof record.total === "number" ? `/${record.total}` : ""
        signals.push({ path: [...path, key].join("."), detail: `${val}${total}` })
      } else if (typeof val === "boolean" && val) {
        signals.push({ path: [...path, key].join("."), detail: "signalé" })
      }
    } else {
      signals.push(...findErrorSignals(val, [...path, key]))
    }
  }
  return signals
}

const isAnomalous = (job: IJobsCronTask): boolean => {
  // "running" à l'heure du digest : le job aurait dû se terminer avant (cf. timing du cron) — signe d'un job bloqué
  if (job.status === "errored" || job.status === "killed" || job.status === "running") return true
  return findErrorSignals(job.output?.result).length > 0
}

const jobTimestamp = (job: IJobsCronTask): number => (job.ended_at ?? job.started_at ?? new Date(0)).getTime()

const STACK_FRAME = /^\s+at /
const MAX_ERROR_SUMMARY_LENGTH = 300

// job-processor stocke le message, les premières lignes de stack puis « Caused by: » pour chaque cause :
// la cause porte souvent l'erreur réelle (ex. ECONNRESET sous une erreur d'import), seules les lignes de stack sont retirées.
const summarizeJobError = (error: string | null | undefined): string => {
  const summary = (error ?? "")
    .split("\n")
    .filter((line) => !STACK_FRAME.test(line))
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
  if (!summary) return "erreur inconnue"
  return summary.length > MAX_ERROR_SUMMARY_LENGTH ? `${summary.slice(0, MAX_ERROR_SUMMARY_LENGTH)}…` : summary
}

// headline : résumé tenant sur une ligne, toujours sûr à afficher entre parenthèses.
// details : liste optionnelle de sous-puces (une par champ *error*), affichée après la parenthèse fermante.
type AnomalyDescription = { headline: string; details?: string }

const describeAnomaly = (job: IJobsCronTask): AnomalyDescription => {
  const duration = job.output?.duration ?? "?"
  if (job.status === "running") {
    return { headline: `toujours en cours, démarré à ${job.started_at?.toISOString() ?? "?"}` }
  }
  if (job.status === "errored" || job.status === "killed") {
    return { headline: `${job.status}, ${duration} : ${summarizeJobError(job.output?.error)}` }
  }
  const signals = findErrorSignals(job.output?.result)
  if (signals.length === 0) return { headline: `${duration} : anomalie non détaillée` }
  const details = signals.map(({ path, detail }) => `\n    ◦ ${path} : ${detail}`).join("")
  return { headline: duration, details }
}

// Un même job (ex. "Process missing Rome...", ~96 exécutions/jour) peut échouer en boucle sur la fenêtre :
// on regroupe par nom pour garder un digest lisible plutôt qu'une ligne par exécution en anomalie.
const formatAnomalyGroup = (name: string, jobsForName: IJobsCronTask[]): string => {
  const [mostRecent] = [...jobsForName].sort((a, b) => jobTimestamp(b) - jobTimestamp(a))
  const { headline, details = "" } = describeAnomaly(mostRecent)
  if (jobsForName.length === 1) {
    return `• ${name} (${headline})${details}`
  }
  return `• ${name} : ${jobsForName.length} exécutions en anomalie sur la période (dernière : ${headline})${details}`
}

const groupByName = (jobs: IJobsCronTask[]): [string, IJobsCronTask[]][] => {
  const groups = new Map<string, IJobsCronTask[]>()
  for (const job of jobs) {
    const group = groups.get(job.name)
    if (group) {
      group.push(job)
    } else {
      groups.set(job.name, [job])
    }
  }
  return [...groups.entries()]
}

// Préfixe le plus long d'abord : un label peut en préfixer un autre.
const PARTNER_LABELS_LONGEST_FIRST = Object.values(JOBPARTNERS_LABEL).sort((a, b) => b.length - a.length)

const EMPTY_IMPORT_ALERT = "GF import vide"

/**
 * Rattache chaque blocage au partenaire nommé dans son message, pour la colonne Alerte du tableau. Un job peut bloquer
 * plusieurs partenaires (segments joints par « ; », cf. formatRemovalGuardBlock) ; ce qui ne nomme aucun partenaire reste
 * en ligne au-dessus du tableau. Par partenaire, une alerte par type : la plus récente (job de nuit et cycle de journée).
 */
export const mapGuardrailBlocksToPartners = (blocks: GuardrailBlock[]) => {
  const alertsByPartner = new Map<string, Map<string, string>>()
  const unmapped: string[] = []
  const set = (partner_label: string, type: string, alert: string) => alertsByPartner.set(partner_label, (alertsByPartner.get(partner_label) ?? new Map()).set(type, alert))
  for (const { jobName, detail } of [...blocks].sort((a, b) => a.at - b.at)) {
    for (const segment of detail.split(" ; ")) {
      const removedLabel = PARTNER_LABELS_LONGEST_FIRST.find((label) => segment.startsWith(`${label} : `))
      const removedRate = segment.match(/\(([^)]+)\) absentes du flux/)?.[1]
      // même format chez commitRawImport et l'import France Travail
      const emptyImportLabel = PARTNER_LABELS_LONGEST_FIRST.find((label) => segment.startsWith(`import ${label} : aucune offre importée`))
      if (removedLabel && removedRate) {
        set(removedLabel, REMOVAL_GUARDRAIL_ALERT_PREFIX, `${REMOVAL_GUARDRAIL_ALERT_PREFIX} ${removedRate}`)
      } else if (emptyImportLabel) {
        const keptCount = segment.match(/les (\d+) offres de l'import précédent sont conservées/)?.[1]
        set(emptyImportLabel, EMPTY_IMPORT_ALERT, keptCount ? `${EMPTY_IMPORT_ALERT} (${keptCount} conservées)` : EMPTY_IMPORT_ALERT)
      } else {
        unmapped.push(`• ${jobName} : ${segment}`)
      }
    }
  }
  const byPartner = new Map([...alertsByPartner].map(([partner_label, alerts]) => [partner_label, [...alerts.values()]]))
  return { byPartner, unmapped }
}

/**
 * Bilan unique des jobs offre-partenaire de la nuit, construit à partir de job_processor.jobs
 * (déjà persisté par job-processor : status, durée, output.result de chaque cron_task).
 * Remplace les notifications Slack de routine envoyées individuellement par chaque job.
 */
export const sendJobPartnersNightlyDigest = async () => {
  const since = new Date(Date.now() - DIGEST_WINDOW_HOURS * 60 * 60 * 1000)

  const jobs = await findJobs<IJobsCronTask>({
    type: "cron_task",
    name: { $in: getJobPartnersNightlyJobNames() },
    // un job encore "running" n'a pas de ended_at : on le remonte quand même, sinon un job bloqué
    // à l'heure du digest disparaîtrait silencieusement du rapport
    $or: [{ ended_at: { $gte: since } }, { status: "running" }],
  })

  if (jobs.length === 0) {
    logger.info("sendJobPartnersNightlyDigest: aucun job à rapporter sur la période")
    return { total: 0, anomalies: 0 }
  }

  const anomalousJobs = jobs.filter(isAnomalous)
  const okCount = jobs.length - anomalousJobs.length

  const summaryLine =
    anomalousJobs.length === 0 ? `${okCount}/${jobs.length} jobs offre-partenaire OK, aucune anomalie.` : `${okCount}/${jobs.length} jobs OK, ${anomalousJobs.length} en erreur :`

  const { byPartner: guardrailAlerts, unmapped: unmappedGuardrailLines } = mapGuardrailBlocksToPartners(getLatestGuardrailBlocks(jobs))
  // Un blocage par garde-fou figure déjà au tableau ou dans sa section : le répéter en anomalie doublerait le message.
  const otherAnomalies = anomalousJobs.filter((job) => !job.output?.error?.includes(GUARDRAIL_ERROR_MARKER))
  const anomalyLines = groupByName(otherAnomalies).map(([name, jobsForName]) => formatAnomalyGroup(name, jobsForName))
  const lines = [
    summaryLine,
    ...(unmappedGuardrailLines.length ? ["Garde-fous déclenchés, vérification requise :", ...unmappedGuardrailLines] : []),
    ...(unmappedGuardrailLines.length && anomalyLines.length ? ["Autres anomalies :"] : []),
    ...anomalyLines,
    ...(await buildPartnerNightlyTable({ since, guardrailAlerts })),
  ]
  const messages = splitSlackMessage(lines, SLACK_MESSAGE_MAX_LENGTH)
  for (const [index, message] of messages.entries()) {
    await notifyToSlack({
      subject: messages.length > 1 ? `${JOB_PARTNERS_DIGEST_JOB_NAME} (${index + 1}/${messages.length})` : JOB_PARTNERS_DIGEST_JOB_NAME,
      message,
      error: anomalousJobs.length > 0,
    })
  }

  logger.info({ total: jobs.length, anomalies: anomalousJobs.length }, "sendJobPartnersNightlyDigest: digest envoyé")

  return { total: jobs.length, anomalies: anomalousJobs.length }
}
