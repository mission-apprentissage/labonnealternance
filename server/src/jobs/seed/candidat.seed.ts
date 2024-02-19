import { logger } from "../../common/logger"
import updateDiplomesMetiers from "../diplomesMetiers/updateDiplomesMetiers"
import updateDomainesMetiers from "../domainesMetiers/updateDomainesMetiers"
import { importCatalogueFormationJob } from "../formationsCatalogue/formationsCatalogue"
import { runScript } from "../scriptWrapper"

runScript(async () => {
  logger.info("Début de l'import des données de référence.")
  logger.info("Domaine Métier...")
  await updateDomainesMetiers()
  logger.info("Formation Catalogue...")
  await importCatalogueFormationJob()
  logger.info("Diplome Métier...")
  await updateDiplomesMetiers()
  logger.info("Import des données de référence terminé.")
})
