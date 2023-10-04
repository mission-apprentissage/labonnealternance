import axios from "axios"

import config from "../../config"

export const notifyToSlack = async ({ subject, message, error }: { subject: string; message: string; error?: boolean }) => {
  if (config.jobSlackWebhook) {
    await axios.post(config.jobSlackWebhook, {
      text: `[${config.env.toUpperCase()} — LBA ${subject && `- ${subject}`}] ${error ? "— :warning:" : "— :white_check_mark:"} — ${message}`,
    })
  }
}
