import { logger } from "../../../../common/logger.js"
import { Formulaire, UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"

function hasUpperCase(str) {
  return str !== str.toLowerCase()
}

const getStat = async () => {
  const users = await UserRecruteur.find({})
  const stat = { CFA: 0, ETP: 0, offreActive: 0, dateExpiration: [], user: [] }
  const userToUpdate = users.filter((x) => hasUpperCase(x.email))

  console.log(userToUpdate.length)

  await asyncForEach(userToUpdate, async (user) => {
    const exist = await UserRecruteur.findOne({ email: user.email.toLowerCase() })

    if (exist) {
      switch (user.type) {
        case "ENTREPRISE":
          stat.ETP++
          const formulaire = await Formulaire.findOne({ id_form: user.id_form, "offres.statut": "Active" })

          if (formulaire) {
            const nbrOffre = formulaire.offres.filter((x) => x.statut === "Active")
            stat.offreActive += nbrOffre.length
            nbrOffre.map((x) => stat.dateExpiration.push(x.date_expiration))
            stat.user.push({ email: user.email, id_form: user.id_form })
          }

          break

        case "CFA":
          stat.CFA++
          const formulaireCFA = await Formulaire.find({ gestionnaire: user.siret, "offres.statut": "Active" })

          console.log("CFA", formulaireCFA.length)

        default:
          break
      }
    }
  })

  return stat
}

runScript(async () => {
  const users = await UserRecruteur.find({})
  const stat = { CFA: 0, ETP: 0, offreActive: 0, dateExpiration: [], user: [] }
  const userToUpdate = users.filter((x) => hasUpperCase(x.email))

  logger.info(`${userToUpdate.length} utilisateur à mettre à jour`)

  const stat = { hasSibblingLowerCase: 0, total: users.length }

  await asyncForEach(userToUpdate, async (user) => {
    const exist = await UserRecruteur.findOne({ email: user.email.toLowerCase() })

    if (exist) {
      stat.hasSibblingLowerCase++

      await UserRecruteur.findOneAndUpdate(
        { email: user.email },
        {
          $push: {
            etat_utilisateur: {
              validation_type: "AUTOMATIQUE",
              statut: "DESACTIVÉ",
              motif: `Utilisateur en doublon (traitement des majuscules ${new Date()}`,
              user: "SERVEUR",
            },
          },
        }
      )
      await Formulaire.findOneAndUpdate({ id_form: user.id_form }, { $set: { statut: "Archivé" } })

      return
    } else {
      user.email = user.email.toLowerCase()
      await user.save()
    }
  })
  return stat
})
