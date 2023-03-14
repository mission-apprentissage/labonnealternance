import { logger } from "../../../../common/logger.js"
import { Formulaire } from "../../../../common/model/index.js"
import { asyncForEach, delay } from "../../../../common/utils/asyncUtils.js"
import { getEtablissementFromGouv } from "../../../../services/etablissement.service.js"
import { runScript } from "../../../scriptWrapper.js"

runScript(async () => {
  logger.info("Start update user adresse detail")
  const formulaires = await Formulaire.find({ adresse_detail: { $eq: null } })

  logger.info(`${formulaires.length} entries to update...`)

  if (!formulaires.length) return

  await asyncForEach(formulaires, async (formulaire, index) => {
    logger.info(`${index}/${formulaires.length} - ${formulaire.gestionnaire ? "delegate" : "entreprise"}`)
    try {
      await delay(500)
      const { etablissement } = await getEtablissementFromGouv(formulaire.siret)

      if (!etablissement) return

      formulaire.adresse_detail = etablissement.adresse

      await formulaire.save()
    } catch (error) {
      const { errors } = error.response.data

      if (errors.length) {
        if (
          errors.includes("Le numéro de siret n'est pas correctement formatté") ||
          errors.includes("Le siret ou siren indiqué n'existe pas, n'est pas connu ou ne comporte aucune information pour cet appel")
        ) {
          console.log(`Invalid siret DELETED : ${formulaire.siret}`)
          await Formulaire.findByIdAndDelete(formulaire._id)
          return
        }
      } else {
        console.log(error.response)
      }
    }
  })
  logger.info("End update user adresse detail")
})
