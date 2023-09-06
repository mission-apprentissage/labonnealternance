import { getPeApiReferentiels } from "../../service/poleEmploi/common"
import { runScript } from "../scriptWrapper"

runScript(async () => {
  await getPeApiReferentiels("niveauxFormations")
})
