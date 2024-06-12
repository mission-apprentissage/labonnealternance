import { ObjectId } from "bson"
import { IReferentielRome } from "shared/models"

import { getRomeV4DetailsFromFT, getRomeV4ListFromFT } from "@/common/apis/FranceTravail"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../../common/logger"
import { asyncForEach, delay } from "../../../common/utils/asyncUtils"

export const importFichesRomeV4 = async () => {
  const romeList = await getRomeV4ListFromFT()

  if (romeList && romeList.length > 500) {
    logger.info(`${romeList.length} fiches métiers trouvées`)

    logger.info("Suppression des fiches métiers V4 courantes")
    await getDbCollection("referentielromes").deleteMany({})

    logger.info("Insertion des fiches métiers V4")

    await asyncForEach(romeList, async (rome, index) => {
      logger.info(`${index + 1}/${romeList.length} : insertion de ${rome.code}`)
      const response = await getRomeV4DetailsFromFT(rome.code)
      const refRome: IReferentielRome = {
        _id: new ObjectId(),
        // TODO est ce que ce code est obsolète ?
        // @ts-ignore
        rome_code: rome.code,
        fiche_metier: response,
      }
      await getDbCollection("referentielromes").insertOne(refRome)
      await delay(1000)
    })
  } else {
    logger.info("Liste des fiches métiers non trouvées ou anormalement petite. Processus interrompu.")
  }
}
