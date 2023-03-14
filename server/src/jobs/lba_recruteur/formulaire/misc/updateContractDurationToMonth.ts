import { logger } from "../../../../common/logger.js"
import { Formulaire } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"

const convertToMonth = (year) => year * 12

runScript(async () => {
  logger.info("Start update contract duration job")
  const formulaires = await Formulaire.find({})

  await asyncForEach(formulaires, async (form) => {
    if (!form.offres.length) return
    await asyncForEach(form.offres, async (offre) => {
      offre.duree_contrat = convertToMonth(offre.duree_contrat ?? 1)
    })
    await form.save({ timestamps: false })
  })
  logger.info("End update contract duration job")
})
