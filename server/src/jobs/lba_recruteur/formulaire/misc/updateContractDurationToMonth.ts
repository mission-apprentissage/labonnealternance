import { logger } from "../../../../common/logger.js"
import { Formulaire } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"

runScript(async () => {
  logger.info("Start update contract duration job")
  const formulaires = await Formulaire.find({ "offres.duree_contrat": { $gt: 36 } })

  await asyncForEach(formulaires, async (form) => {
    if (!form.offres.length) return

    await asyncForEach(form.offres, async (offre) => {
      if (offre.duree_contrat > 36) {
        offre.duree_contrat = 36
      }
    })
    await form.save({ timestamps: false })
  })
  logger.info("End update contract duration job")
})
