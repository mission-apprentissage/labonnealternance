import importFormationsCatalogue from "./importFormationsCatalogue.js"
import { runScript } from "../scriptWrapper.js"

runScript(async () => {
  await importFormationsCatalogue()
})
