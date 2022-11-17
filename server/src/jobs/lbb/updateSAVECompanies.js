import { BonnesBoites } from "../../common/model/index.js"
import { logMessage } from "../../common/utils/logMessage.js"

const updateSAVECompanies = async ({ updateMap }) => {
  logMessage("info", "Starting updateSAVECompanies")
  for (const key in updateMap) {
    let company = updateMap[key]

    let bonneBoite = await BonnesBoites.findOne({ siret: company.siret })

    if (bonneBoite) {
      let shouldSave = true
      // remplacement pour une bonneBoite trouvée par les données modifiées dans la table update SAVE
      if (company.raisonsociale) {
        bonneBoite.raisonsociale = company.raisonsociale
      }
      if (company.enseigne) {
        bonneBoite.enseigne = company.enseigne
      }

      if (company?.email === "remove") {
        bonneBoite.email = ""
      } else if (company.email && company.email != "NULL") {
        bonneBoite.email = company.email
      }

      if (company?.telephone === "remove") {
        bonneBoite.telephone = ""
      } else if (company.telephone && company.telephone != "NULL") {
        bonneBoite.telephone = company.telephone
      }

      if (company?.website === "remove") {
        bonneBoite.website = ""
      } else if (company.website && company.website != "NULL") {
        bonneBoite.website = company.website
      }

      bonneBoite.type = company.type

      if (company.romes) {
        bonneBoite.romes = [...new Set(company.romes.concat(bonneBoite.romes))]
      }

      if (company.removedRomes) {
        bonneBoite.romes = bonneBoite.romes.filter((el) => !company.removedRomes.includes(el))
        if (bonneBoite.romes.length === 0) {
          logMessage("info", "suppression bb car pas de romes " + bonneBoite.siret)
          try {
            await bonneBoite.remove()
          } catch (err) {
            //console.log("not found when removing ",bonneBoite.siret);
          }
          shouldSave = false
        }
      }

      if (shouldSave) {
        await bonneBoite.save()
      }
    }
  }
  logMessage("info", "Ended updateSAVECompanies")
}

export { updateSAVECompanies }
