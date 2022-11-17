import updateSendinblueBlockedEmails from "./updateSendinblueBlockedEmails.js"
import { runScript } from "../scriptWrapper.js"

runScript(async () => {
  await updateSendinblueBlockedEmails({ query: {} })
})
