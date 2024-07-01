import { IFormationCatalogue } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { asyncForEach } from "../../common/utils/asyncUtils"
import { getParcoursupAndAffelnetPerimetreFromCatalogueME } from "../../services/catalogue.service"

export const updateParcoursupAndAffelnetInfoOnFormationCatalogue = async () => {
  logger.info("--- update formation catalogue data --- start")
  const formations = await getDbCollection("formationcatalogues")
    .find({}, { projection: { _id: 0, cle_ministere_educatif: 1 } })
    .toArray()
  const catalogueMinistereEducatif = await getParcoursupAndAffelnetPerimetreFromCatalogueME()

  if (!catalogueMinistereEducatif) return

  await asyncForEach(formations, async (formation: IFormationCatalogue) => {
    const found = catalogueMinistereEducatif.find((formationME) => formationME.cle_ministere_educatif === formation.cle_ministere_educatif)

    if (found) {
      const { parcoursup_perimetre_prise_rdv, affelnet_perimetre_prise_rdv, parcoursup_id } = found
      await getDbCollection("formationcatalogues").updateOne(
        { cle_ministere_educatif: formation.cle_ministere_educatif },
        { $set: { affelnet_visible: affelnet_perimetre_prise_rdv, parcoursup_visible: parcoursup_perimetre_prise_rdv, parcoursup_id } }
      )
    }
  })
  logger.info("--- update formation catalogue data --- end")
}
