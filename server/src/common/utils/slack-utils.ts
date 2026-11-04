import axios from "axios"

import config from "@/config"

type SlackWebhookPayload = {
  text: string
}

export const SLACK_CHANNEL_MENTION = "<!channel>"
export const SLACK_HERE_MENTION = "<!here>"

// résout un pseudo vers une mention notifiante <@memberId> via config.slackTeamMemberIds ;
// sans ID connu, retombe sur un @pseudo purement visuel (aucune notification)
export const slackMention = (memberName: string): string => {
  if ((memberName.startsWith("<") && memberName.endsWith(">")) || memberName.startsWith("@")) return memberName
  const memberId = config.slackTeamMemberIds[memberName]
  return memberId ? `<@${memberId}>` : `@${memberName}`
}

/**
 * Erreur dédiée à la place de l'AxiosError : son `config.url` est le webhook, un secret que le scrub de sentry.ts
 * ne retire pas (il ne coupe que la query). Ni l'erreur d'origine ni sa cause ne sont transmises.
 */
export class SlackNotificationError extends Error {
  constructor(reason: string) {
    super(`envoi Slack refusé (${reason})`)
    this.name = "SlackNotificationError"
  }
}

const slackNotificationError = (err: unknown): SlackNotificationError => {
  const { response, code } = (err ?? {}) as { response?: { status?: number }; code?: string }
  return new SlackNotificationError(response?.status ? `HTTP ${response.status}` : (code ?? "erreur réseau"))
}

/**
 * Tableau en bloc de code : seule mise en forme tabulaire rendue par le champ `text` d'un webhook Slack.
 * Les colonnes numériques (`alignRight`) sont alignées à droite.
 */
export const formatSlackTable = (header: string[], rows: string[][], { alignRight = [] }: { alignRight?: boolean[] } = {}): string[] => {
  const widths = header.map((title, column) => Math.max(title.length, ...rows.map((row) => (row[column] ?? "").length)))
  const formatRow = (row: string[]) =>
    header
      .map((_, column) => {
        const cell = row[column] ?? ""
        return alignRight[column] ? cell.padStart(widths[column]) : cell.padEnd(widths[column])
      })
      .join(" ")
      .trimEnd()
  return ["```", formatRow(header), ...rows.map(formatRow), "```"]
}

export const notifyToSlack = async ({
  subject,
  message,
  error,
  mentions,
  webhook,
}: {
  subject: string
  message: string
  error?: boolean
  mentions?: string[]
  /** Webhook d'un canal dédié ; à défaut, celui des jobs. */
  webhook?: string
}) => {
  const mentionText = mentions?.length ? ` — cc ${mentions.map(slackMention).join(" ")}` : ""
  const text = `[${config.env.toUpperCase()} — LBA ${subject && `- ${subject}`}] ${error ? "— :warning:" : "— :white_check_mark:"} — ${message}${mentionText}`
  const url = webhook || config.jobSlackWebhook
  if (url) {
    const payload: SlackWebhookPayload = { text }
    try {
      await axios.post(url, payload)
    } catch (err) {
      throw slackNotificationError(err)
    }
  } else {
    console.info(text)
  }
}
