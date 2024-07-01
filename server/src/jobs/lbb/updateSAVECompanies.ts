import { ObjectId } from "mongodb"
import { oleoduc, transformData, writeData } from "oleoduc"
import { IUnsubscribedLbaCompany } from "shared"

import { checkIsDiffusible } from "@/services/etablissement.service"

import { logMessage } from "../../common/utils/logMessage"
import { getDbCollection } from "../../common/utils/mongodbUtils"

import { downloadSAVEFile, getCompanyMissingData, initMaps, streamSAVECompanies } from "./lbaCompaniesUtils"

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
        const lbaCompany = await getDbCollection("bonnesboites").findOne({ siret: company.siret })

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

          if (lbaCompany.rome_codes?.length && (await checkIsDiffusible(lbaCompany.siret))) {
            await getDbCollection("bonnesboites").updateOne({ _id: lbaCompany._id }, lbaCompany)
          } else {
            await getDbCollection("bonnesboites").deleteOne({ _id: lbaCompany._id })
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
      if (await !checkIsDiffusible(rawCompany.siret)) {
        return null
      }

      // est-ce que la fonction doit retourner les dates ou sont-elles présentes dans le rawCompany ? il manque le typage de la source
      const company = await getCompanyMissingData(rawCompany)
      if (company) {
        try {
          const lbaCompany = await getDbCollection("bonnesboites").findOne({ siret: company.siret })
          if (!lbaCompany) {
            await getDbCollection("bonnesboites").insertOne(company)
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
      // Ce bloc ne sera utile qu'une seule fois.
      const unsubed = await getDbCollection("unsubscribedbonnesboites").findOne({ siret: company.siret })
      const now = new Date()
      if (!unsubed) {
        const toUnsub: IUnsubscribedLbaCompany = {
          _id: new ObjectId(),
          siret: company.siret,
          raison_sociale: "",
          enseigne: "Suppression via script SAVE",
          naf_code: "",
          naf_label: "",
          rome_codes: [],
          insee_city_code: "",
          zip_code: "",
          city: "",
          company_size: "",
          created_at: now,
          last_update_at: now,
          unsubscribe_date: now,
          unsubscribe_reason: "Autre",
        }
        await getDbCollection("unsubscribedbonnesboites").insertOne(toUnsub)
      }

      await getDbCollection("bonnesboites").deleteOne({ siret: company.siret })
    })
  )

  logMessage("info", "Ended removeSAVECompanies")
}
