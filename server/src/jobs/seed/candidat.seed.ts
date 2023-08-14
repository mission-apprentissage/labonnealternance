import updateReferentielRncpRomes from "../referentielRncpRome/updateReferentielRncpRomes.js"
import { logger } from "../../common/logger.js"
import updateDiplomesMetiers from "../diplomesMetiers/updateDiplomesMetiers.js"
import updateDomainesMetiers from "../domainesMetiers/updateDomainesMetiers.js"
import { importCatalogueFormationJob } from "../formationsCatalogue/formationsCatalogue.js"
import { runScript } from "../scriptWrapper.js"

runScript(async () => {
  logger.info("Début de l'import des données de référence.")
  logger.info("Domaine Métier...")
  await updateDomainesMetiers()
  logger.info("Formation Catalogue...")
  await importCatalogueFormationJob()
  logger.info("Diplome Métier...")
  await updateDiplomesMetiers()
  logger.info("Référentiel rncp romes...")
  await updateReferentielRncpRomes()
  logger.info("Import des données de référence terminé.")
})
