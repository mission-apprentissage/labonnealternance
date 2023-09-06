import { runScript } from "../scriptWrapper"

import anonymizeOldApplications from "./anonymizeOldApplications"

runScript(async () => {
  await anonymizeOldApplications()
})
