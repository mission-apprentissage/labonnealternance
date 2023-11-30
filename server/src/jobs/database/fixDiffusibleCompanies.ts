import { setTimeout } from "timers/promises"

import Boom from "boom"
import { ILbaCompany } from "shared"

import { logger } from "@/common/logger"
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
  logger.info(`Fixing diffusible lba companies`)
  const lbaCompanies: AsyncIterable<ILbaCompany> = await db.collection("bonnesboites").find({})

  let count = 0
  let deletedCount = 0
  let errorCount = 0
  for await (const lbaCompany of lbaCompanies) {
    if (count % 500 === 0) {
      logger.info(`${count} companies checked. ${deletedCount} removed. ${errorCount} errors`)
    }
    count++
    try {
      const isDiffusible = await getDiffusionStatus(lbaCompany.siret)

      if (isDiffusible !== "diffusible") {
        await db.collection("bonnesboites").deleteOne({ siret: lbaCompany.siret })
        deletedCount++
      }
    } catch (err) {
      errorCount++
      console.log(err)
      break
    }
  }
  logger.info(`Final result : ${count} companies checked. ${deletedCount} removed. ${errorCount} errors`)

  logger.info(`Fixing lba companies done`)
}

export async function fixDiffusibleCompanies(): Promise<void> {
  await fixLbaCompanies()
}
