// @ts-nocheck
import { runScript } from "../scriptWrapper.js"
import updateSendinblueBlockedEmails from "./updateSendinblueBlockedEmails.js"

runScript(async () => {
  await updateSendinblueBlockedEmails({ query: {} })
})
