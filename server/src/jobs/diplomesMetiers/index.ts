import { runScript } from "../scriptWrapper"

import updateDiplomesMetiers from "./updateDiplomesMetiers"

runScript(async () => {
  await updateDiplomesMetiers()
})
