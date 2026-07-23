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

export const notifyToSlack = async ({ subject, message, error, mentions }: { subject: string; message: string; error?: boolean; mentions?: string[] }) => {
  const mentionText = mentions?.length ? ` — cc ${mentions.map(slackMention).join(" ")}` : ""
  const text = `[${config.env.toUpperCase()} — LBA ${subject && `- ${subject}`}] ${error ? "— :warning:" : "— :white_check_mark:"} — ${message}${mentionText}`
  if (config.jobSlackWebhook) {
    const payload: SlackWebhookPayload = { text }
    await axios.post(config.jobSlackWebhook, payload)
  } else {
    console.info(text)
  }
}
