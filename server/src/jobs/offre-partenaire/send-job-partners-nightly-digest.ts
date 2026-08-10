import type { IJobsCronTask } from "job-processor"
import { findJobs } from "job-processor"
import { logger } from "@/common/logger"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { importers } from "./jobs-partners.importer"

const DIGEST_WINDOW_HOURS = 24

export const JOB_PARTNERS_DIGEST_JOB_NAME = "Bilan nocturne offres partenaires"

// Calculé à l'appel (pas au chargement du module) : jobs-partners.importer.ts importe ce fichier pour enregistrer
// son propre CronDef, donc `importers` n'est pas encore initialisé tant que ce module est en cours de chargement.
const getJobPartnersNightlyJobNames = () => Object.keys(importers).filter((name) => name !== JOB_PARTNERS_DIGEST_JOB_NAME)

const hasNonZeroErrorCount = (value: unknown): boolean => {
  if (value == null) return false
  if (Array.isArray(value)) return value.some(hasNonZeroErrorCount)
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, val]) => {
      if (/error/i.test(key) && typeof val === "number") return val > 0
      return hasNonZeroErrorCount(val)
    })
  }
  return false
}

const isAnomalous = (job: IJobsCronTask): boolean => {
  if (job.status === "errored" || job.status === "killed") return true
  return hasNonZeroErrorCount(job.output?.result)
}

const formatAnomaly = (job: IJobsCronTask): string => {
  const duration = job.output?.duration ?? "?"
  if (job.status === "errored" || job.status === "killed") {
    return `• ${job.name} (${job.status}, ${duration}) : ${job.output?.error ?? "erreur inconnue"}`
  }
  return `• ${job.name} (${duration}) : ${JSON.stringify(job.output?.result)}`
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
    ended_at: { $gte: since },
  })

  if (jobs.length === 0) {
    logger.info("sendJobPartnersNightlyDigest: aucun job à rapporter sur la période")
    return { total: 0, anomalies: 0 }
  }

  const anomalousJobs = jobs.filter(isAnomalous)
  const okCount = jobs.length - anomalousJobs.length

  const summaryLine =
    anomalousJobs.length === 0 ? `${okCount}/${jobs.length} jobs offre-partenaire OK, aucune anomalie.` : `${okCount}/${jobs.length} jobs OK, ${anomalousJobs.length} en erreur :`

  const message = [summaryLine, ...anomalousJobs.map(formatAnomaly)].join("\n")

  await notifyToSlack({
    subject: "Bilan nocturne offres partenaires",
    message,
    error: anomalousJobs.length > 0,
  })

  logger.info({ total: jobs.length, anomalies: anomalousJobs.length }, "sendJobPartnersNightlyDigest: digest envoyé")

  return { total: jobs.length, anomalies: anomalousJobs.length }
}
