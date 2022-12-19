import axios from "axios"
import config from "../../config.js"

export const notifyToSlack = async ({ subject, message }) => {
  if (config.jobSlackWebhook) {
    await axios.post(config.jobSlackWebhook, {
      text: `[${config.env.toUpperCase()} — LBA ${subject && `- ${subject}`}] — ${message}`,
    })
  }
}
