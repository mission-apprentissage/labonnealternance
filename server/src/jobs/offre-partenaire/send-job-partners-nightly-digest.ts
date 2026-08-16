import type { IJobsCronTask } from "job-processor"
import { findJobs } from "job-processor"
import { logger } from "@/common/logger"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { importers } from "./jobs-partners.importer"

const DIGEST_WINDOW_HOURS = 24
const MAX_MESSAGE_LENGTH = 35_000 // marge sous la limite Slack (~40k caractères) pour le champ `text`

export const JOB_PARTNERS_DIGEST_JOB_NAME = "Bilan nocturne offres partenaires"

// Jobs de la pipeline jobs_partners enregistrés directement dans jobs.ts (tag "main"/"slave"),
// donc absents du map `importers` ci-dessous mais dont le digest doit quand même surveiller les anomalies.
const ADDITIONAL_MONITORED_JOB_NAMES = ["Traitement des recruteur LBA par la pipeline jobs partners"]

// Calculé à l'appel (pas au chargement du module) : jobs-partners.importer.ts importe ce fichier pour enregistrer
// son propre CronDef, donc `importers` n'est pas encore initialisé tant que ce module est en cours de chargement.
const getJobPartnersNightlyJobNames = () => [...Object.keys(importers).filter((name) => name !== JOB_PARTNERS_DIGEST_JOB_NAME), ...ADDITIONAL_MONITORED_JOB_NAMES]

type ErrorSignal = { path: string; detail: string }

// Parcourt récursivement un résultat de job (souvent imbriqué : { filled: { step1: {total,success,error}, ... } })
// et n'en extrait que les champs *error* non nuls, avec leur chemin et leur total si disponible.
// Évite de dumper le JSON complet (souvent illisible sur Slack) pour ne montrer que ce qui compte.
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

// headline : résumé tenant sur une ligne, toujours sûr à afficher entre parenthèses.
// details : liste optionnelle de sous-puces (une par champ *error*), affichée après la parenthèse fermante.
type AnomalyDescription = { headline: string; details?: string }

const describeAnomaly = (job: IJobsCronTask): AnomalyDescription => {
  const duration = job.output?.duration ?? "?"
  if (job.status === "running") {
    return { headline: `toujours en cours, démarré à ${job.started_at?.toISOString() ?? "?"}` }
  }
  if (job.status === "errored" || job.status === "killed") {
    return { headline: `${job.status}, ${duration} : ${job.output?.error ?? "erreur inconnue"}` }
  }
  const signals = findErrorSignals(job.output?.result)
  if (signals.length === 0) return { headline: `${duration} : anomalie non détaillée` }
  const details = signals.map(({ path, detail }) => `\n    ◦ ${path} : ${detail}`).join("")
  return { headline: duration, details }
}

// Un même job (ex. "Process missing Rome...", ~65 exécutions/jour) peut échouer en boucle sur la fenêtre :
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

  const anomalyLines = groupByName(anomalousJobs).map(([name, jobsForName]) => formatAnomalyGroup(name, jobsForName))
  let message = [summaryLine, ...anomalyLines].join("\n")
  if (message.length > MAX_MESSAGE_LENGTH) {
    message = `${message.slice(0, MAX_MESSAGE_LENGTH)}\n… (message tronqué, voir les logs pour le détail complet)`
  }

  await notifyToSlack({
    subject: JOB_PARTNERS_DIGEST_JOB_NAME,
    message,
    error: anomalousJobs.length > 0,
  })

  logger.info({ total: jobs.length, anomalies: anomalousJobs.length }, "sendJobPartnersNightlyDigest: digest envoyé")

  return { total: jobs.length, anomalies: anomalousJobs.length }
}
