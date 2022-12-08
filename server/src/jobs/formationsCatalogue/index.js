import { runScript } from "../scriptWrapper.js"
import importFormationsCatalogue from "./formationsCatalogue.js"

runScript(async () => {
  await importFormationsCatalogue()
})
