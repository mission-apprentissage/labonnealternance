import { runScript } from "../scriptWrapper.js"
import updateReferentielRncpRomes from "./updateReferentielRncpRomes.js"

runScript(async () => {
  await updateReferentielRncpRomes()
})
