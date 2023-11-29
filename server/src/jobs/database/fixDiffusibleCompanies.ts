import { setTimeout } from "timers/promises"

import Boom from "boom"
import { ILbaCompany } from "shared"

import { logger } from "@/common/logger"
import { LbaCompanyNonDiffusible } from "@/common/model"
import { db } from "@/common/mongodb"
import { getEtablissementDiffusionStatus } from "@/services/etablissement.service"

const MAX_RETRY = 100
const DELAY = 100

const getDiffusionStatus = async (siret: string, count = 1) => {
  const isDiffusible = await getEtablissementDiffusionStatus(siret)
  if (isDiffusible === "quota") {
    if (count > MAX_RETRY) throw Boom.internal(`Api entreprise or cache entreprise not availabe. Tried ${MAX_RETRY} times`)
    await setTimeout(DELAY, "result")
    return await getDiffusionStatus(siret, count++)
  }
  return isDiffusible
}

const fixLbaCompanies = async () => {
  logger.info(`fixing diffusible lba companies users`)
  const lbaCompanies: AsyncIterable<ILbaCompany> = await db.collection("bonnesboites").find({}).skip(216168)

  let count = 1
  for await (const lbaCompany of lbaCompanies) {
    try {
      const isDiffusible = await getDiffusionStatus(lbaCompany.siret)

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
