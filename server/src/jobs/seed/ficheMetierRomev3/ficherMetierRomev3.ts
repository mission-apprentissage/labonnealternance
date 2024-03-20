import { getRomeDetailsFromAPI } from "@/common/apis/FranceTravail"

import { logger } from "../../../common/logger"
import { FicheMetierRomeV3 } from "../../../common/model"
import { asyncForEach, delay } from "../../../common/utils/asyncUtils"

import { romes } from "./romeCodeList"

export const importFicheMetierRomeV3 = async () => {
  await asyncForEach(romes, async (rome, index) => {
    logger.info(`${index + 1}/${romes.length}`)
    const exist = await FicheMetierRomeV3.findOne({ code: rome }).lean()
    if (exist) return
    const response = await getRomeDetailsFromAPI(rome)
    await FicheMetierRomeV3.create({ code: response?.code, fiche_metier: response })
    await delay(700)
  })
}
