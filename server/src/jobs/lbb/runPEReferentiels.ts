import { runScript } from "../scriptWrapper.js"
import { getPeApiReferentiels } from "../../service/poleEmploi/common.js"

runScript(async () => {
  await getPeApiReferentiels("niveauxFormations")
})
