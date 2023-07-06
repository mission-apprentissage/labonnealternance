import { IBonneBoite } from "../common/model/schema/bonneboite/bonneboite.types.js"
import { BonnesBoites } from "../common/model/index.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"

/**
 * Met à jour les coordonnées de contact d'une société issue de l'algo
 * A usage interne
 * @param {string} siret
 * @param {string} email
 * @param {string} phone
 * @returns {Promise<IBonneBoite | string>}
 */
export const updateContactInfo = async ({ siret, email, phone }: { siret: string; email: string; phone: string }): Promise<IBonneBoite | string> => {
  try {
    const bonneBoite = await BonnesBoites.findOne({ siret })

    if (!bonneBoite) {
      return "not_found"
    } else {
      if (email !== undefined) {
        bonneBoite.email = email
      }

      if (phone !== undefined) {
        bonneBoite.phone = phone
      }

      await bonneBoite.save()

      return bonneBoite
    }
  } catch (err) {
    sentryCaptureException(err)
    throw err
  }
}
