import { IFormationCatalogue } from "shared"

import { db } from "@/common/mongodb"

import { logger } from "../../common/logger"
import { FormationCatalogue } from "../../common/model/index"
import { asyncForEach } from "../../common/utils/asyncUtils"
import { getParcoursupAndAffelnetPerimetreFromCatalogueME } from "../../services/catalogue.service"

export const updateParcoursupAndAffelnetInfoOnFormationCatalogue = async () => {
  logger.info("--- update formation catalogue data --- start")
  const formations = await FormationCatalogue.find({}).select({ cle_ministere_educatif: 1 }).lean()
  const catalogueMinistereEducatif = await getParcoursupAndAffelnetPerimetreFromCatalogueME()

  if (!catalogueMinistereEducatif) return

  await asyncForEach(formations, async (formation: IFormationCatalogue) => {
    const found = catalogueMinistereEducatif.find((formationME) => formationME.cle_ministere_educatif === formation.cle_ministere_educatif)

    if (found) {
      const { parcoursup_perimetre_prise_rdv, affelnet_perimetre_prise_rdv, parcoursup_id } = found
      await db
        .collection("formationcatalogues")
        .updateOne(
          { cle_ministere_educatif: formation.cle_ministere_educatif },
          { $set: { affelnet_visible: affelnet_perimetre_prise_rdv, parcoursup_visible: parcoursup_perimetre_prise_rdv, parcoursup_id } }
        )
    }
  })
  logger.info("--- update formation catalogue data --- end")
}
