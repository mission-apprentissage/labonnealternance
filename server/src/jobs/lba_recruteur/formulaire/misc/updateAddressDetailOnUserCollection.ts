import { CFA, ENTREPRISE } from "../../../../common/constants.js"
import { logger } from "../../../../common/logger.js"
import { Formulaire, UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach, delay } from "../../../../common/utils/asyncUtils.js"
import { getEtablissementFromGouv, getEtablissementFromReferentiel } from "../../../../services/etablissement.service.js"
import { runScript } from "../../../scriptWrapper.js"

runScript(async () => {
  logger.info("Start update user adresse detail")
  const users = await UserRecruteur.find({ type: { $in: [ENTREPRISE, CFA] }, adresse_detail: { $eq: null } })

  logger.info(`${users.length} entries to update...`)

  if (!users.length) return

  await asyncForEach(users, async (user, index) => {
    console.log(`${index}/${users.length} - ${user.type}`)

    switch (user.type) {
      case ENTREPRISE:
        try {
          await delay(500)
          const { etablissement } = await getEtablissementFromGouv(user.siret)
          const formulaire = await Formulaire.findOne({ id_form: user.id_form })

          if (!etablissement) return

          user.adresse_detail = etablissement.adresse
          formulaire.adresse_detail = etablissement.adresse

          await Promise.all([user.save(), formulaire.save()])
        } catch (error) {
          const { errors } = error.response.data

          if (errors.length) {
            if (
              errors.includes("Le numéro de siret n'est pas correctement formatté") ||
              errors.includes("Le siret ou siren indiqué n'existe pas, n'est pas connu ou ne comporte aucune information pour cet appel")
            ) {
              console.log(`Invalid siret DELETED : ${user.siret} - User & Formulaire removed`)
              await Promise.all([UserRecruteur.findByIdAndDelete(user._id), Formulaire.findOneAndRemove({ id_form: user.id_form })])
              return
            }
          } else {
            console.log(error.response)
          }
        }
        break

      case CFA:
        try {
          await delay(300)
          const cfa = await getEtablissementFromReferentiel(user.siret)

          if (!cfa) return

          user.adresse_detail = cfa.adresse

          await user.save()
        } catch (error) {
          const { data } = error.response

          if (data) {
            if (data.error === "Not Found") {
              console.log(`Invalid siret DELETED : ${user.siret} – User and ${Formulaire.countDocuments({ gestionnaire: user.siret })} formulaire(s) removed`)
              await UserRecruteur.findByIdAndDelete(user._id)
              await Formulaire.deleteMany({ gestionnaire: user.siret })
              return
            }
          }

          if (error?.response?.data) {
            console.log(error?.response?.data)
            console.log(user.siret, user.createdAt)
          } else {
            console.log(error?.response)
          }
        }
        break
      default:
        break
    }
  })
  logger.info("End update user adresse detail")
})
