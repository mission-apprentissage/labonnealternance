import { oleoduc, transformData, writeData } from "oleoduc"

import { LbaCompany } from "../../common/model/index.js"
import { logMessage } from "../../common/utils/logMessage"

import { downloadSAVEFile, getCompanyMissingData, initMaps, streamSAVECompanies } from "./lbaCompaniesUtils.js"

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
        const lbaCompany = await LbaCompany.findOne({ siret: company.siret })

        if (lbaCompany) {
          if (company.raison_sociale) {
            lbaCompany.raison_sociale = company.raison_sociale
            lbaCompany.enseigne = company.raison_sociale
          }
          if (company.email !== undefined) {
            lbaCompany.email = company.email
          }
          if (company.phone !== undefined) {
            lbaCompany.phone = company.phone
          }
          if (company.website !== undefined) {
            lbaCompany.website = company.website
          }
          if (company.rome_codes !== undefined) {
            lbaCompany.rome_codes = company.rome_codes
          } else if (company.removedRomes != undefined) {
            lbaCompany.rome_codes = lbaCompany.rome_codes.filter((el) => !company.removedRomes.includes(el))
            if (lbaCompany.rome_codes.length === 0) {
              logMessage("info", "suppression bb car pas de romes " + lbaCompany.siret)
            }
          }

          if (lbaCompany.rome_codes?.length) {
            await lbaCompany.save()
          } else {
            await lbaCompany.remove()
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
          let lbaCompany = await LbaCompany.findOne({ siret: company.siret })
          if (!lbaCompany) {
            lbaCompany = new LbaCompany(company)
            await lbaCompany.save()
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
      await LbaCompany.deleteOne({ siret: company.siret })
    })
  )

  logMessage("info", "Ended removeSAVECompanies")
}
