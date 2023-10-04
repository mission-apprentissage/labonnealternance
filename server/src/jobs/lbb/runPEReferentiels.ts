import { getPeApiReferentiels } from "@/services/pejob.service"

import { runScript } from "../scriptWrapper"

runScript(async () => {
  await getPeApiReferentiels("niveauxFormations")
})
