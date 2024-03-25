import { getFtApiReferentiels } from "@/services/ftjob.service"

import { runScript } from "../scriptWrapper"

runScript(async () => {
  await getFtApiReferentiels("niveauxFormations")
})
