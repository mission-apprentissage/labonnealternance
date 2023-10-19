import Boom from "boom"

import { logger } from "../../../../common/logger.js"
import { Recruiter, UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach, delay } from "../../../../common/utils/asyncUtils.js"
import { CFA, ENTREPRISE } from "../../../../services/constant.service.js"
import { getEtablissementFromGouv } from "../../../../services/etablissement.service.js"

export const updateAddressDetailOnUserrecrutersCollection = async () => {
  logger.info("Start update user adresse detail")
  const users = await UserRecruteur.find({ type: { $in: [ENTREPRISE, CFA] }, address_detail: null })

  logger.info(`${users.length} entries to update...`)

  if (!users.length) return

  await asyncForEach(users, async (user, index) => {
    console.log(`${index}/${users.length} - ${user.type} - ${user.establishment_siret} - ${user._id}`)

    try {
      await delay(500)
      const etablissement = await getEtablissementFromGouv(user.establishment_siret)

      if (!etablissement) return

      user.address_detail = etablissement.data.adresse

      if (user.type !== ENTREPRISE) {
        await user.save()
        return
      }

      const { establishment_id } = user
      if (!establishment_id) {
        throw Boom.internal("unexpected: no establishment_id on userRecruteur of type ENTREPRISE", { userId: user._id })
      }
      const formulaire = await Recruiter.findOne({ establishment_id })

      if (!formulaire) {
        return
      }

      formulaire.address_detail = formulaire ? etablissement.data.adresse : undefined

      await Promise.all([user.save(), formulaire.save()])
    } catch (error: any) {
      const { errors } = error.response.data

      if (errors.length) {
        if (
          errors.includes("Le numéro de siret n'est pas correctement formatté") ||
          errors.includes("Le siret ou siren indiqué n'existe pas, n'est pas connu ou ne comporte aucune information pour cet appel")
        ) {
          console.log(`Invalid siret DELETED : ${user.establishment_siret} - User & Formulaire removed`)
          const { establishment_id } = user
          await UserRecruteur.findByIdAndDelete(user._id)
          if (establishment_id) {
            await Recruiter.findOneAndRemove({ establishment_id })
          }
          return
        }
      } else {
        console.log(error.response)
      }
    }
  })
  logger.info("End update user adresse detail")
}
