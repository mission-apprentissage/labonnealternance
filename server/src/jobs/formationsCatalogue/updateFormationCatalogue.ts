import { db } from "common/mongodb"

import { logger } from "../../common/logger"
import { FormationCatalogue } from "../../common/model/index"
import { IFormationCatalogue } from "../../common/model/schema/formationCatalogue/formationCatalogue.types"
import { asyncForEach } from "../../common/utils/asyncUtils"
import { getFormationsFromCatalogueMe } from "../../services/catalogue.service"

export const updateFormationCatalogue = async () => {
  logger.info("--- update formation catalogue data --- start")
  const formations = await FormationCatalogue.find({ $and: [{ affelnet_statut: null }, { parcoursup_id: null }] }).lean()

  logger.info(`${formations.length} à contrôler...`)

  await asyncForEach(formations, async (formation: IFormationCatalogue) => {
    const formationME = await getFormationsFromCatalogueMe({
      limit: 1,
      query: { cle_ministere_educatif: formation.cle_ministere_educatif },
      select: { parcoursup_id: 1, affelnet_statut: 1 },
    })
    const { parcoursup_id, affelnet_statut } = formationME[0]

    await db.collection("formationcatalogues").updateOne({ cle_ministere_educatif: formation.cle_ministere_educatif }, { $set: { parcoursup_id, affelnet_statut } })
  })
  logger.info("--- update formation catalogue data --- end")
}
