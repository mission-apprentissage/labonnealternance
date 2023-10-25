import { logger } from "../../../../common/logger.js"
import { Recruiter } from "../../../../common/model/index.js"
import { asyncForEach, delay } from "../../../../common/utils/asyncUtils.js"
import { getEtablissementFromGouv } from "../../../../services/etablissement.service.js"

export const updateAddressDetailOnRecruitersCollection = async () => {
  logger.info("Start update user adresse detail")
  const etablissements = await Recruiter.find({ address_detail: null })

  logger.info(`${etablissements.length} entries to update...`)

  if (!etablissements.length) return

  await asyncForEach(etablissements, async (etb, index) => {
    logger.info(`${index}/${etablissements.length} - ${etb.cfa_delegated_siret ? "delegate" : "entreprise"}`)
    try {
      await delay(500)
      const etablissement = await getEtablissementFromGouv(etb.establishment_siret)

      if (!etablissement) return

      etb.address_detail = etablissement?.data.adresse

      await etb.save()
    } catch (error: any) {
      const { errors } = error.response.data

      if (errors.length) {
        if (
          errors.includes("Le numéro de siret n'est pas correctement formatté") ||
          errors.includes("Le siret ou siren indiqué n'existe pas, n'est pas connu ou ne comporte aucune information pour cet appel")
        ) {
          console.log(`Invalid siret DELETED : ${etb.establishment_siret}`)
          await Recruiter.findByIdAndDelete(etb._id)
          return
        }
      } else {
        console.log(error.response)
      }
    }
  })
  logger.info("End update user adresse detail")
}
