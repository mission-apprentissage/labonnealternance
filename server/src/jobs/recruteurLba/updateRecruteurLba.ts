import { oleoduc, transformData, writeData } from "oleoduc"
import { ILbaCompany, ZLbaCompany } from "shared/models/recruteurLba.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logMessage } from "../../common/utils/logMessage"

import { getCompanyMissingData } from "./recruteurLbaUtil"

const prepareCompany = async (rawCompany): Promise<ILbaCompany | null> => {
  rawCompany.siret = rawCompany.siret.toString().padStart(14, "0")
  if (!rawCompany.enseigne && rawCompany.raison_sociale) {
    rawCompany.enseigne = rawCompany.raison_sociale
  }

  rawCompany.phone = rawCompany.phone ? rawCompany.phone.toString().padStart(10, "0") : null
  rawCompany.zip_code = rawCompany.zip_code ? rawCompany.zip_code.toString().padStart(5, "0") : null

  if (!rawCompany.enseigne) {
    logMessage("error", `Error processing company. Company ${rawCompany.siret} has no name`)
    return null
  }

  const unsubscribedLbaCompany = await getDbCollection("unsubscribedrecruteurslba").findOne(
    { siret: rawCompany.siret },
    {
      projection: {
        siret: 1,
        _id: 0,
      },
    }
  )
  if (unsubscribedLbaCompany) {
    return null
  }

  const company = await getCompanyMissingData(rawCompany)

  return company
}

export const processAlgoCompanies = async () => {
  await oleoduc(
    getDbCollection("raw_recruteurslba").find({}).stream(),
    transformData((company) => prepareCompany(company), { parallel: 8 }),
    writeData(async (lbaCompany) => {
      try {
        if (lbaCompany) {
          const parsedCompany = ZLbaCompany.parse(lbaCompany)
          await getDbCollection("recruteurslba").insertOne(parsedCompany)
        }
      } catch (err) {
        logMessage("error", err)
      }
    })
  )
}
