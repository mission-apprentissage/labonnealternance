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

const CODE_FENCE = "```"

/**
 * Slack coupe l'affichage d'un `text` long vers 4 000 caractères, au besoin dans un bloc de code. Marge pour l'en-tête
 * ajouté par notifyToSlack ; découper avec splitSlackMessage.
 */
export const SLACK_MESSAGE_MAX_LENGTH = 3_500

/**
 * Découpe un message en morceaux d'au plus `maxLength` caractères, entre deux lignes. Un tableau coupé
 * (cf. formatSlackTable) est refermé, puis rouvert avec son en-tête dans le morceau suivant.
 */
// une ligne seule doit laisser la place de refermer le tableau qui la contient
const LINE_MARGIN = 10

export const splitSlackMessage = (lines: string[], maxLength: number): string[] => {
  const chunks: string[][] = []
  let current: string[] = []
  let inCode = false
  let tableHeader: string | null = null
  const lengthOf = (chunk: string[]) => chunk.join("\n").length
  const flush = () => {
    if (inCode) current.push(CODE_FENCE)
    chunks.push(current)
    current = inCode && tableHeader !== null ? [CODE_FENCE, tableHeader] : []
  }
  // place réservée pour refermer un tableau ouvert
  const closingReserve = () => (inCode ? CODE_FENCE.length + 1 : 0)

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.length > maxLength - LINE_MARGIN ? `${rawLine.slice(0, maxLength - LINE_MARGIN)}…` : rawLine
    const isFence = line === CODE_FENCE
    // un tableau ne commence pas en fin de morceau : son ouverture, son en-tête et une ligne au moins partent ensemble
    const block = isFence && !inCode ? [line, ...lines.slice(index + 1, index + 3), CODE_FENCE] : [line]
    const needed = lengthOf([...current, ...block]) + (isFence ? 0 : closingReserve())
    const onlyReopenedTable = inCode && current.length === 2
    if (current.length && !onlyReopenedTable && needed > maxLength && !(isFence && inCode)) flush()

    if (!current.length && line === "") continue
    current.push(line)
    if (isFence) {
      inCode = !inCode
      tableHeader = inCode ? (lines[index + 1] ?? null) : null
    }
  }
  if (current.length) chunks.push(current)
  return chunks.map((chunk) => chunk.join("\n").trimEnd())
}
