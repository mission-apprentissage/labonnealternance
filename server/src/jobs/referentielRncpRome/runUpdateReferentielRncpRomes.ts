import { runScript } from "../scriptWrapper"

import updateReferentielRncpRomes from "./updateReferentielRncpRomes"

runScript(async () => {
  await updateReferentielRncpRomes()
})
