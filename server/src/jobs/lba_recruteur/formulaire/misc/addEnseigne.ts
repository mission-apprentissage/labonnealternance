// @ts-nocheck
import { Recruiter, UserRecruteur } from "../../../../common/model/index.js"
import { runScript } from "../../../scriptWrapper.js"

runScript(async ({ etablissement }) => {
  const errors = []
  const itemsUpdated = {}
  const [formulaires, users] = await Promise.all([Recruiter.find({ siret: { $exists: true } }).lean(), UserRecruteur.find({ siret: { $exists: true } }).lean()])

  for (const formulaire of formulaires) {
    try {
      const { data } = await etablissement.getEtablissementFromGouv(formulaire.establishment_siret)
      const enseigneFromApiEntreprise = data.etablissement?.enseigne
      if (enseigneFromApiEntreprise) {
        await Formulaire.collection.update({ _id: formulaire._id }, { establishment_enseigne: enseigneFromApiEntreprise })
        itemsUpdated[`${formulaire.establishment_siret}`] = enseigneFromApiEntreprise
      }
    } catch (error) {
      errors.push(error)
    }
  }

  for (const user of users) {
    try {
      const { data } = await etablissement.getEtablissementFromGouv(user.establishment_siret)

      const enseigneFromApiEntreprise = data.etablissement?.enseigne

      if (enseigneFromApiEntreprise) {
        await UserRecruteur.collection.update({ _id: user._id }, { establishment_enseigne: enseigneFromApiEntreprise })
        itemsUpdated[`${user.establishment_siret}`] = enseigneFromApiEntreprise
      }
    } catch (error) {
      errors.push(error)
    }
  }

  return {
    errors,
    itemsUpdated,
  }
})
