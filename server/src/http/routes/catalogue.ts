import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { getFormations } from "../../common/utils/catalogue.js"
import { getUniqueArray } from "../../common/utils/array.js"

/**
 * @description Catalogue router.
 */
export default () => {
  const router = express.Router()

  /**
   * @description Proxify catalogue's requests.
   */
  router.get(
    "/formations",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}
      const page = qs && qs.page ? parseInt(qs.page, 10) : 1
      const limit = qs && qs.limit ? parseInt(qs.limit, 10) : 50

      const response = await getFormations(query, page, limit)

      return res.send(response)
    })
  )

  /**
   * @description Proxify catalogue's requests.
   */
  router.get(
    "/formations/filter",
    tryCatch(async (req, res) => {
      const qs = req.query
      const query = qs && qs.query ? JSON.parse(qs.query) : {}

      const response = await getFormations(query, 1, 10000)
      const totalFormations = response.formations.length

      const criterias1 = ["etablissement_formateur_siret", "cfd"]
      const arrayFiltered1 = getUniqueArray(response.formations, criterias1)

      const criterias2 = ["etablissement_formateur_siret", "etablissement_gestionnaire_siret", "cfd"]
      const arrayFiltered2 = getUniqueArray(response.formations, criterias2)

      const criterias3 = ["etablissement_formateur_siret", "cfd", "code_postal"]
      const arrayFiltered3 = getUniqueArray(response.formations, criterias3)

      const criterias4 = ["etablissement_formateur_siret", "etablissement_gestionnaire_siret", "cfd", "code_postal"]
      const arrayFiltered4 = getUniqueArray(response.formations, criterias4)

      const mapper = (item) => ({
        intitule_long: item.intitule_long,
        lieu_formation_adress: item.lieu_formation_adress,
        etablissement_formateur_siret: item.etablissement_formateur_siret,
        etablissement_gestionnaire_siret: item.etablissement_gestionnaire_siret,
        cfd: item.cfd,
        code_postal: item.code_postal,
      })

      return res.send({
        filtre_1: {
          criteres_unicite_catalogue: criterias1,
          total_formations_avant_filtrage: totalFormations,
          total_formations_apres_filtrage: arrayFiltered1.length,
          formations: arrayFiltered1.map(mapper),
        },
        filtre_2: {
          criteres_unicite_catalogue: criterias2,
          total_formations_avant_filtrage: totalFormations,
          total_formations_apres_filtrage: arrayFiltered2.length,
          formations: arrayFiltered2.map(mapper),
        },
        filtre_3: {
          criteres_unicite_catalogue: criterias3,
          total_formations_avant_filtrage: totalFormations,
          total_formations_apres_filtrage: arrayFiltered3.length,
          formations: arrayFiltered3.map(mapper),
        },
        filtre_4: {
          criteres_unicite_catalogue: criterias4,
          total_formations_avant_filtrage: totalFormations,
          total_formations_apres_filtrage: arrayFiltered4.length,
          formations: arrayFiltered4.map(mapper),
        },
      })
    })
  )

  return router
}
