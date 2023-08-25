import { runScript } from "../scriptWrapper.js"
import { getPeApiReferentiels } from "../../services/pejob.service.js"

runScript(async () => {
  await getPeApiReferentiels("niveauxFormations")
})
