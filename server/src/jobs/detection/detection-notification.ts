import type { IDetectionAlert, IDetectionSeverity } from "shared/models/detection-alerts.model"

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

const EMAIL_PATTERN = /[^\s@<>|]+@[^\s@<>|]+\.[a-z]{2,}/i

/**
 * Garde-fou de #5421 : un constat ne porte que des identifiants techniques, des comptes et des liens.
 * Seules les adresses email sont détectables ; le message d'erreur ne reprend pas la valeur en cause.
 */
export const assertNoEmailInFinding = (ruleId: string, finding: IDetectionFinding) => {
  const texts = [
    finding.key,
    finding.summary,
    ...Object.values(finding.metrics).filter((value): value is string => typeof value === "string"),
    ...(finding.links ?? []).flatMap(({ label, url }) => [label, url]),
  ]
  if (texts.some((text) => EMAIL_PATTERN.test(text))) {
    throw new Error(`constat écarté de la règle ${ruleId} : adresse email détectée`)
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

export const notifyDetection = async (
  target: IDetectionNotificationTarget,
  type: IDetectionNotificationType,
  alert: IDetectionAlert,
  links: IDetectionFinding["links"],
  now: Date
) =>
  notifyToSlack({
    subject: SUBJECT,
    message: formatDetectionNotification(target, type, alert, links, now),
    error: type !== "sortie",
    webhook: config.detectionSlackWebhook,
  })

export const sendDetectionTestAlert = async () => {
  await notifyToSlack({
    subject: SUBJECT,
    message: "Alerte de test du socle de détection (#5421), sans suite à donner.",
    error: false,
    webhook: config.detectionSlackWebhook,
  })
  return { webhook: config.detectionSlackWebhook ? "dédié" : "jobs (repli)" }
}
