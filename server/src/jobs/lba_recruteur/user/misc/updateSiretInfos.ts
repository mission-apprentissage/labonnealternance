import { logger } from "../../../../common/logger.js"
import { UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"
import { ETAT_UTILISATEUR, ENTREPRISE, CFA } from "../../../../services/constant.service.js"
import { getEntrepriseDataFromSiret, updateOne, ErrorCodes } from "../../../../services/etablissement.service.js"
import { sentryCaptureException } from "../../../../common/utils/sentryUtils.js"

runScript(async () => {
  const query = {
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ERROR] },
    $or: [{ type: CFA }, { type: ENTREPRISE }],
  }
  const recruteurs = await UserRecruteur.find(query).lean()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des recruteurs en erreur: ${recruteurs.length} recruteurs à mettre à jour...`)
  await asyncForEach(recruteurs, async (recruteur) => {
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret: recruteur.establishment_siret, fromDashboardCfa: false })
      if ("error" in siretResponse) {
        await updateOne({ _id: recruteur._id }, siretResponse)
      } else {
        await updateOne({ _id: recruteur._id }, siretResponse)
        stats.success++
      }
    } catch (err) {
      sentryCaptureException(err)
      stats.failure++
    }
  })
  return stats
})
