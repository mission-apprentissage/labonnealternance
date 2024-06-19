import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../../../common/logger"
import { asyncForEach, delay } from "../../../../common/utils/asyncUtils"
import { getEtablissementFromGouv } from "../../../../services/etablissement.service"

export const updateAddressDetailOnRecruitersCollection = async () => {
  logger.info("Start update user adresse detail")
  const etablissements = await getDbCollection("recruiters").find({ address_detail: null }).toArray()

  logger.info(`${etablissements.length} entries to update...`)

  if (!etablissements.length) return

  await asyncForEach(etablissements, async (etb, index) => {
    logger.info(`${index}/${etablissements.length} - ${etb.cfa_delegated_siret ? "delegate" : "entreprise"}`)
    try {
      await delay(500)
      const etablissement = await getEtablissementFromGouv(etb.establishment_siret)

      if (!etablissement) return

      etb.address_detail = etablissement?.data.adresse

      await getDbCollection("recruiters").updateOne({ _id: etb._id }, { $set: { ...etb } })
    } catch (error: any) {
      const { errors } = error.response.data

      if (errors.length) {
        if (
          errors.includes("Le numéro de siret n'est pas correctement formatté") ||
          errors.includes("Le siret ou siren indiqué n'existe pas, n'est pas connu ou ne comporte aucune information pour cet appel")
        ) {
          console.log(`Invalid siret DELETED : ${etb.establishment_siret}`)
          await getDbCollection("recruiters").deleteOne({ _id: etb._id })
          return
        }
      } else {
        console.error(error.response)
      }
    }
  })
  logger.info("End update user adresse detail")
}
