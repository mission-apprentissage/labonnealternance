import { setTimeout } from "timers/promises"

import { ILbaCompany } from "shared"

import { logger } from "@/common/logger"
import { LbaCompanyNonDiffusible } from "@/common/model"
import { db } from "@/common/mongodb"
import { getEtablissementDiffusionStatus } from "@/services/etablissement.service"

const fixLbaCompanies = async () => {
  logger.info(`fixing diffusible lba companies users`)
  const lbaCompanies: AsyncIterable<ILbaCompany> = await db.collection("bonnesboites").find({})

  let count = 1
  for await (const lbaCompany of lbaCompanies) {
    try {
      let isDiffusible = await getEtablissementDiffusionStatus(lbaCompany.siret)
      while (isDiffusible === "quota") {
        await setTimeout(150, "result")
        isDiffusible = await getEtablissementDiffusionStatus(lbaCompany.siret)
      }

      console.log("isDiffusible : ", count++, isDiffusible, lbaCompany.siret, lbaCompany.enseigne)

      if (isDiffusible !== "diffusible") {
        await new LbaCompanyNonDiffusible(lbaCompany).save()
        await db.collection("bonnesboites").deleteOne({ siret: lbaCompany.siret })
      }
    } catch (err) {
      console.log(err)
      break
    }
  }

  logger.info(`ctrling companies ok`)
}

export async function fixDiffusibleCompanies(): Promise<void> {
  await fixLbaCompanies()
}
