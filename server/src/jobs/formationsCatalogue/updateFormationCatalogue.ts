import { IFormationCatalogue } from "shared"

import { db } from "@/common/mongodb"

import { logger } from "../../common/logger"
import { FormationCatalogue } from "../../common/model/index"
import { asyncForEach } from "../../common/utils/asyncUtils"
import { getFormationsFromCatalogueMe } from "../../services/catalogue.service"

export const updateParcoursupIdAndAffelnetStatusOnFormationCatalogueCollection = async () => {
  logger.info("--- update formation catalogue data --- start")
  const formations = await FormationCatalogue.find({ $or: [{ affelnet_statut: null }, { parcoursup_id: null }, { parcoursup_statut: null }] }).lean()
  const catalogueMinistereEducatif = await getFormationsFromCatalogueMe({
    limit: 1000,
    query: {
      published: true,
      $or: [{ parcoursup_id: { $ne: null } }, { affelnet_statut: { $in: ["publié", "en attente de publication"] } }, { parcoursup_statut: "publié" }],
    },
    select: { parcoursup_id: 1, affelnet_statut: 1, cle_ministere_educatif: 1, parcoursup_statut: 1 },
  })

  await asyncForEach(formations, async (formation: IFormationCatalogue) => {
    const found = catalogueMinistereEducatif.find((formationME) => formationME.cle_ministere_educatif === formation.cle_ministere_educatif)

    if (found) {
      const { parcoursup_id, affelnet_statut, parcoursup_statut } = found
      await db
        .collection("formationcatalogues")
        .updateOne({ cle_ministere_educatif: formation.cle_ministere_educatif }, { $set: { parcoursup_id, affelnet_statut, parcoursup_statut } })
    }
  })
  logger.info("--- update formation catalogue data --- end")
}
