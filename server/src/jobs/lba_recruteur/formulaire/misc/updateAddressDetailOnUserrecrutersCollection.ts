import { CFA, ENTREPRISE } from "../../../../common/constants.js"
import { logger } from "../../../../common/logger.js"
import { Recruiter, UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach, delay } from "../../../../common/utils/asyncUtils.js"
import { getEtablissementFromGouv } from "../../../../services/etablissement.service.js"
import { runScript } from "../../../scriptWrapper.js"

runScript(async () => {
  logger.info("Start update user adresse detail")
  const users = await UserRecruteur.find({ type: { $in: [ENTREPRISE, CFA] }, address_detail: { $eq: null } })

  logger.info(`${users.length} entries to update...`)

  if (!users.length) return

  await asyncForEach(users, async (user, index) => {
    console.log(`${index}/${users.length} - ${user.type} - ${user.establishment_siret} - ${user._id}`)

    try {
      await delay(500)
      const { data } = await getEtablissementFromGouv(user.establishment_siret)

      if (!data) return

      user.address_detail = data.adresse

      if (user.type !== ENTREPRISE) {
        await user.save()
        return
      }

      const formulaire = await Recruiter.findOne({ establishment_id: user.establishment_id })

      formulaire.address_detail = formulaire ? data.adresse : undefined

      await Promise.all([user.save(), formulaire.save()])
    } catch (error) {
      const { errors } = error.response.data

      if (errors.length) {
        if (
          errors.includes("Le numéro de siret n'est pas correctement formatté") ||
          errors.includes("Le siret ou siren indiqué n'existe pas, n'est pas connu ou ne comporte aucune information pour cet appel")
        ) {
          console.log(`Invalid siret DELETED : ${user.establishment_siret} - User & Formulaire removed`)
          await Promise.all([UserRecruteur.findByIdAndDelete(user._id), Recruiter.findOneAndRemove({ establishment_id: user.establishment_id })])
          return
        }
      } else {
        console.log(error.response)
      }
    }
  })
  logger.info("End update user adresse detail")
})
