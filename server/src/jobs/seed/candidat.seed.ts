import { logger } from "../../common/logger"
import updateDiplomesMetiers from "../diplomesMetiers/updateDiplomesMetiers"
import updateDomainesMetiers from "../domainesMetiers/updateDomainesMetiers"
import { importCatalogueFormationJob } from "../formationsCatalogue/formationsCatalogue"
import updateReferentielRncpRomes from "../referentielRncpRome/updateReferentielRncpRomes"
import { runScript } from "../scriptWrapper"

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
