import { getFormulaire } from "../../../../services/formulaire.service.js"
import { deactivateUser, updateUser } from "../../../../services/userRecruteur.service.js"
import { logger } from "../../../../common/logger.js"
import { UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { sentryCaptureException } from "../../../../common/utils/sentryUtils.js"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR } from "../../../../services/constant.service.js"
import { autoValidateCompany, getEntrepriseDataFromSiret } from "../../../../services/etablissement.service.js"

export const updateSiretInfosInError = async () => {
  const query = {
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ERROR] },
    $or: [{ type: CFA }, { type: ENTREPRISE }],
  }
  const userRecruteurs = await UserRecruteur.find(query).lean()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des recruteurs en erreur: ${userRecruteurs.length} recruteurs à mettre à jour...`)
  await asyncForEach(userRecruteurs, async (userRecruteur) => {
    const { establishment_siret, type, _id, establishment_id } = userRecruteur
    try {
      const recruteur = await getFormulaire({ establishment_id })
      const { cfa_delegated_siret } = recruteur
      const siretResponse = await getEntrepriseDataFromSiret({ siret: establishment_siret, fromDashboardCfa: type === CFA, cfa_delegated_siret })
      if ("error" in siretResponse) {
        logger.warn(`Correction des recruteurs en erreur: userRecruteur id=${_id}, désactivation car création interdite, raison=${siretResponse.message}`)
        await deactivateUser(_id)
        stats.deactivated++
      } else {
        const result = await updateUser({ _id }, siretResponse)
        await autoValidateCompany(result)
        stats.success++
      }
    } catch (err) {
      logger.error(err)
      logger.error(`Correction des recruteurs en erreur: userRecruteur id=${_id}, erreur: ${(err && "message" in err && err.message) || err}`)
      sentryCaptureException(err)
      stats.failure++
    }
  })
  return stats
}
