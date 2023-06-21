// @ts-nocheck
import { runScript } from "../scriptWrapper.js"
import updateBrevoBlockedEmails from "./updateBrevoBlockedEmails.js"

runScript(async () => {
  await updateBrevoBlockedEmails({ query: {} })
})
