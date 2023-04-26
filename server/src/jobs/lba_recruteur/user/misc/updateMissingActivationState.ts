import { Model } from "mongoose"
import { logger } from "../../../../common/logger.js"
import { Formulaire, UserRecruteur } from "../../../../common/model/index.js"
import { IUserRecruteur } from "../../../../common/model/schema/userRecruteur/userRecruteur.types.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"

runScript(async () => {
  logger.info(`Start update missing validation state for entreprise...`)
  const entreprises = await UserRecruteur.find({ type: "ENTREPRISE", etat_utilisateur: [] })

  logger.info(`${entreprises.length} etp à mettre à jour...`)
  await asyncForEach(entreprises, async (etp) => {
    const found = await Formulaire.findOne({ id_form: etp.id_form })

    if (found) {
      await UserRecruteur.findOneAndUpdate({ _id: etp._id }, { $push: { etat_utilisateur: { validation_type: "AUTOMATIQUE", user: "SERVEUR", statut: "VALIDÉ" } } })
    } else {
      await UserRecruteur.findByIdAndDelete(etp._id)
    }
  })

  logger.info(`Done.`)
})
