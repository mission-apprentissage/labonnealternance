import { runScript } from "../scriptWrapper.js"
import { importCatalogueFormationJob } from "./formationsCatalogue.js"

runScript(async () => {
  await importCatalogueFormationJob()
})
