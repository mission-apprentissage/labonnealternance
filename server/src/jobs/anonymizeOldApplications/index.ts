import anonymizeOldApplications from "./anonymizeOldApplications.js"
import { runScript } from "../scriptWrapper.js"

runScript(async () => {
  await anonymizeOldApplications()
})
