import axios from "axios"
import config from "../../config.js"

export const notifyToSlack = async ({ subject, message, error }: { subject: string; message: string; error?: boolean }) => {
  if (config.jobSlackWebhook) {
    await axios.post(config.jobSlackWebhook, {
      text: `[${config.env.toUpperCase()} — LBA ${subject && `- ${subject}`}] ${error ? "— :warning:" : "— :white_check_mark:"} — ${message}`,
    })
  }
}
