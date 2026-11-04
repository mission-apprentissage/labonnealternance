import type { IDetectionAlert, IDetectionMetrics, IDetectionSeverity } from "shared/models/detection-alerts.model"

import { notifyToSlack } from "@/common/utils/slack-utils"
import config from "@/config"
import type { IDetectionFinding, IDetectionRule } from "./detection-rule"

const HOUR_MS = 60 * 60 * 1000
const SUBJECT = "DÉTECTION"

export type IDetectionNotificationTarget = Pick<IDetectionRule, "id" | "title" | "severity">

export type IDetectionNotificationType = "entree" | "rappel" | "sortie"

const SEVERITY_LABELS: Record<IDetectionSeverity, string> = {
  haute: "gravité haute",
  moyenne: "gravité moyenne",
  technique: "incident technique",
}

// Bornes de EMAIL_PATTERN (sentry.ts). La partie locale exclut « / » et « : » : une arobase dans un chemin d'URL
// (`/package/@sentry/node.js`) n'est pas une adresse.
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,24}/

const decodeUrlEscapes = (text: string) => {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

// Une adresse passée dans un lien par encodeURIComponent s'écrit `rh%40entreprise.fr`.
const containsEmail = (text: string) => EMAIL_PATTERN.test(text) || EMAIL_PATTERN.test(decodeUrlEscapes(text))

const metricTexts = (metrics: IDetectionMetrics) => Object.entries(metrics).flatMap(([name, value]) => (typeof value === "string" ? [name, value] : [name]))

/**
 * Garde-fou de #5421 : un constat ne porte que des identifiants techniques, des comptes et des liens.
 * Seules les adresses email sont détectables ; le message d'erreur ne reprend pas la valeur en cause.
 */
export const assertNoEmailInFinding = (ruleId: string, finding: IDetectionFinding) => {
  const texts = [finding.key, finding.summary, ...metricTexts(finding.metrics), ...(finding.links ?? []).flatMap(({ label, url }) => [label, url])]
  if (texts.some(containsEmail)) {
    throw new Error(`constat écarté de la règle ${ruleId} : adresse email détectée`)
  }
}

/** Les mesures d'un passage sont journalisées à chaque évaluation, constat ou non : même garde-fou que les constats. */
export const assertNoEmailInObservations = (ruleId: string, observations: IDetectionMetrics | undefined) => {
  if (observations && metricTexts(observations).some(containsEmail)) {
    throw new Error(`mesures écartées de la règle ${ruleId} : adresse email détectée`)
  }
}

const formatDate = (date: Date) => date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })

const formatDuration = (from: Date, to: Date) => {
  const hours = Math.round((to.getTime() - from.getTime()) / HOUR_MS)
  return hours < 48 ? `${hours} h` : `${Math.round(hours / 24)} j`
}

const formatLinks = (links: IDetectionFinding["links"] = []) => links.map(({ label, url }) => `<${url}|${label}>`).join(" · ")

export const formatDetectionNotification = (
  target: IDetectionNotificationTarget,
  type: IDetectionNotificationType,
  alert: IDetectionAlert,
  links: IDetectionFinding["links"],
  now: Date
): string => {
  const title = `${target.title} (${SEVERITY_LABELS[target.severity]})`
  const openedAt = alert.opened_at ?? alert.first_seen_at
  const reference = `\`${target.id}\` · \`${alert.key}\` · alerte \`${alert._id}\``
  switch (type) {
    case "entree":
      return [`Entrée en alerte · ${title}`, alert.summary, formatLinks(links), reference].filter(Boolean).join("\n")
    case "rappel":
      return [`Rappel · ${title} · en alerte depuis le ${formatDate(openedAt)} (${formatDuration(openedAt, now)})`, alert.summary, formatLinks(links), reference]
        .filter(Boolean)
        .join("\n")
    case "sortie":
      return [`Sortie d'alerte · ${title} · après ${formatDuration(openedAt, now)}`, `Dernier constat : ${alert.summary}`, reference].join("\n")
  }
}

/** Envoi refusé : la règle a bien été évaluée, seul l'envoi est à retenter. */
export class DetectionNotificationError extends Error {
  constructor(cause: unknown) {
    super(`notification de détection non envoyée (${cause instanceof Error ? cause.name : "Error"})`, { cause })
    this.name = "DetectionNotificationError"
  }
}

export const notifyDetection = async (
  target: IDetectionNotificationTarget,
  type: IDetectionNotificationType,
  alert: IDetectionAlert,
  links: IDetectionFinding["links"],
  now: Date
) => {
  try {
    await notifyToSlack({
      subject: SUBJECT,
      message: formatDetectionNotification(target, type, alert, links, now),
      error: type !== "sortie",
      webhook: config.detectionSlackWebhook,
    })
  } catch (error) {
    throw new DetectionNotificationError(error)
  }
}

export const sendDetectionTestAlert = async () => {
  await notifyToSlack({
    subject: SUBJECT,
    message: "Alerte de test du socle de détection (#5421), sans suite à donner.",
    error: false,
    webhook: config.detectionSlackWebhook,
  })
  return { webhook: config.detectionSlackWebhook ? "dédié" : "jobs (repli)" }
}
