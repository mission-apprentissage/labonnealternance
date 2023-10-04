import { Recruiter, UserRecruteur } from "../../../../common/model/index"
import { getEtablissementFromGouv } from "../../../../services/etablissement.service"
import { runScript } from "../../../scriptWrapper"

runScript(async () => {
  const errors: any[] = []
  const itemsUpdated = {}
  const [formulaires, users] = await Promise.all([Recruiter.find({ siret: { $exists: true } }).lean(), UserRecruteur.find({ siret: { $exists: true } }).lean()])

  for (const formulaire of formulaires) {
    try {
      const data = await getEtablissementFromGouv(formulaire.establishment_siret)
      const enseigneFromApiEntreprise = data?.data.enseigne
      if (enseigneFromApiEntreprise) {
        await Recruiter.findOneAndUpdate({ _id: formulaire._id }, { establishment_enseigne: enseigneFromApiEntreprise })
        itemsUpdated[`${formulaire.establishment_siret}`] = enseigneFromApiEntreprise
      }
    } catch (error: any) {
      errors.push(error)
    }
  }

  for (const user of users) {
    try {
      const data = await getEtablissementFromGouv(user.establishment_siret)

      const enseigneFromApiEntreprise = data?.data.enseigne

      if (enseigneFromApiEntreprise) {
        await UserRecruteur.findOneAndUpdate({ _id: user._id }, { establishment_enseigne: enseigneFromApiEntreprise })
        itemsUpdated[`${user.establishment_siret}`] = enseigneFromApiEntreprise
      }
    } catch (error: any) {
      errors.push(error)
    }
  }

  return {
    errors,
    itemsUpdated,
  }
})
