import { runScript } from "../scriptWrapper"

import { importCatalogueFormationJob } from "./formationsCatalogue"

runScript(async () => {
  await importCatalogueFormationJob()
})
