// @ts-nocheck
import { BonnesBoites } from "../../common/model/index.js"
import { logMessage } from "../../common/utils/logMessage.js"

const updateSAVECompanies = async ({ updateMap }) => {
  logMessage("info", "Starting updateSAVECompanies")
  for (const key in updateMap) {
    const company = updateMap[key]

    const bonneBoite = await BonnesBoites.findOne({ siret: company.siret })

    if (bonneBoite) {
      let shouldSave = true
      // remplacement pour une bonneBoite trouvée par les données modifiées dans la table update SAVE
      if (company.raison_sociale) {
        bonneBoite.raison_sociale = company.raison_sociale
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
        bonneBoite.phone = ""
      } else if (company.telephone && company.telephone != "NULL") {
        bonneBoite.phone = company.telephone
      }

      if (company?.website === "remove") {
        bonneBoite.website = ""
      } else if (company.website && company.website != "NULL") {
        bonneBoite.website = company.website
      }

      bonneBoite.algorithm_origin = company.algorithm_origin

      if (company.rome_codes) {
        bonneBoite.rome_codes = [...new Set(company.rome_codes.concat(bonneBoite.rome_codes))]
      }

      if (company.removedRomes) {
        bonneBoite.rome_codes = bonneBoite.rome_codes.filter((el) => !company.removedRomes.includes(el))
        if (bonneBoite.rome_codes.length === 0) {
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
