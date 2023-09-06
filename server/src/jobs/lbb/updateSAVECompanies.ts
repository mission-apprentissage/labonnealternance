// @ts-nocheck
import { oleoduc, transformData, writeData } from "oleoduc"

import { BonnesBoites } from "../../common/model/index"
import { logMessage } from "../../common/utils/logMessage"

import { downloadSAVEFile, getCompanyMissingData, initMaps, streamSAVECompanies } from "./bonnesBoitesUtils"

export const updateSAVECompanies = async () => {
  logMessage("info", "Starting updateSAVECompanies")

  const key = "updateSAVE.json"
  await downloadSAVEFile({ key })

  await oleoduc(
    await streamSAVECompanies({ key }),
    transformData(
      (company) => {
        company.siret = company.siret.toString().padStart(14, "0")
        return company
      },
      { parallel: 8 }
    ),
    writeData(async (company) => {
      try {
        const bonneBoite = await BonnesBoites.findOne({ siret: company.siret })

        if (bonneBoite) {
          if (company.raison_sociale) {
            bonneBoite.raison_sociale = company.raison_sociale
            bonneBoite.eneigne = company.raison_sociale
          }
          if (company.email !== undefined) {
            bonneBoite.email = company.email
          }
          if (company.phone !== undefined) {
            bonneBoite.phone = company.phone
          }
          if (company.website !== undefined) {
            bonneBoite.website = company.website
          }
          if (company.rome_codes !== undefined) {
            bonneBoite.rome_codes = company.rome_codes
          } else if (company.removedRomes != undefined) {
            bonneBoite.rome_codes = bonneBoite.rome_codes.filter((el) => !company.removedRomes.includes(el))
            if (bonneBoite.rome_codes.length === 0) {
              logMessage("info", "suppression bb car pas de romes " + bonneBoite.siret)
            }
          }

          if (bonneBoite.rome_codes?.length) {
            await bonneBoite.save()
          } else {
            await bonneBoite.remove()
          }
        }
        //else company no more in collection => doing nothing
      } catch (err) {
        logMessage("error", err)
      }
    })
  )

  logMessage("info", "Ended updateSAVECompanies")
}

export const insertSAVECompanies = async () => {
  logMessage("info", "Starting insertSAVECompanies")

  const key = "addSAVE.json"
  await downloadSAVEFile({ key })

  await initMaps()

  await oleoduc(
    await streamSAVECompanies({ key }),
    transformData(
      (company) => {
        company.siret = company.siret.toString().padStart(14, "0")
        return company
      },
      { parallel: 2 }
    ),
    writeData(async (rawCompany) => {
      const company = await getCompanyMissingData(rawCompany)
      if (company) {
        try {
          let bonneBoite = await BonnesBoites.findOne({ siret: company.siret })
          if (!bonneBoite) {
            bonneBoite = new BonnesBoites(company)
            await bonneBoite.save()
          }
        } catch (err) {
          logMessage("error", err)
        }
      }
    })
  )

  logMessage("info", "Ended insertSAVECompanies")
}

export const removeSAVECompanies = async () => {
  logMessage("info", "Starting removeSAVECompanies")

  const key = "removeSAVE.json"
  await downloadSAVEFile({ key })

  await oleoduc(
    await streamSAVECompanies({ key }),
    transformData(
      (company) => {
        company.siret = company.siret.toString().padStart(14, "0")
        return company
      },
      { parallel: 8 }
    ),
    writeData(async (company) => {
      await BonnesBoites.deleteOne({ siret: company.siret })
    })
  )

  logMessage("info", "Ended removeSAVECompanies")
}
