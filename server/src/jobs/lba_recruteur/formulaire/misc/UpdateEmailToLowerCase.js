import { Formulaire, UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { runScript } from "../../../scriptWrapper.js"

function hasUpperCase(str) {
  return str !== str.toLowerCase()
}

runScript(async () => {
  const users = await UserRecruteur.find({})
  const stat = { hasSibblingLowerCase: 0, total: users.length, detail: [] }

  const userToUpdate = users.filter((x) => hasUpperCase(x.email))

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
              motif: "Utilisateur en doublon (traitement des majuscules (27/12/2022)",
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
