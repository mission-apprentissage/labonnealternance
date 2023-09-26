import { runScript } from "../scriptWrapper"

import updateBrevoBlockedEmails from "./updateBrevoBlockedEmails"

runScript(async () => {
  await updateBrevoBlockedEmails({ AllAddresses: {} })
})
