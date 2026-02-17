import fs from "node:fs/promises"
import z from "zod"
import { parseCsvContent } from "@/common/utils/fileUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"

export const getRomeDetailsFromDB = async (romeCode: string) =>
  getDbCollection("referentielromes").findOne(
    { "rome.code_rome": romeCode },
    {
      projection: {
        _id: 0,
        couple_appellation_rome: 0,
      },
    }
  )
export const getFicheMetierFromDB = async ({ query }) => getDbCollection("referentielromes").findOne(query)

// let romeV4toV3: Record<string, string> = {}
let romeV3toV4: Record<string, string[]> = {}
let isMappingInitialized = false

// export async function getRomeV3FromRomeV4(codeRomeV4: string): Promise<string | undefined> {
//   if (!isMappingInitialized) {
//     await buildRomeV4toV3()
//   }
//   return romeV4toV3[codeRomeV4]
// }

async function getRomesV4FromRomeV3(codeRomeV3: string): Promise<string[]> {
  if (!isMappingInitialized) {
    await buildRomeV4toV3()
  }
  return romeV3toV4[codeRomeV3] ?? []
}

export async function expandRomesV3toV4(romesV3: string[]): Promise<string[]> {
  const allRomes = new Set<string>(romesV3)

  await asyncForEach(romesV3, async (rome) => {
    const romesV4 = await getRomesV4FromRomeV3(rome)
    romesV4.forEach((romeV4) => {
      allRomes.add(romeV4)
    })
  })
  return [...allRomes]
}

async function buildRomeV4toV3() {
  const filepath = getStaticFilePath("referentiel/unix_referentiel_code_rome_v460_utf8.csv")
  const content = (await fs.readFile(filepath)).toString()
  const parsedCsv = await parseCsvContent(content, { delimiter: "," })
  const data = z
    .array(
      z.object({
        code_rome: z.string(),
        code_rome_parent: z.string(),
      })
    )
    .parse(parsedCsv)

  const validData = data.filter((line) => line.code_rome !== line.code_rome_parent)

  // romeV4toV3 = {}
  romeV3toV4 = {}

  validData.forEach(({ code_rome, code_rome_parent }) => {
    // if (romeV4toV3[code_rome]) {
    //   throw new Error(`rome=${code_rome} a déjà une correspondance`)
    // }
    // romeV4toV3[code_rome] = code_rome_parent

    let group = romeV3toV4[code_rome_parent]
    if (!group) {
      group = []
      romeV3toV4[code_rome_parent] = group
    }
    group.push(code_rome)
  })

  isMappingInitialized = true
}

setTimeout(() => {
  buildRomeV4toV3().catch((err) => {
    logger.error("erreur lors de l'initialisation du mapping rome V3 / V4", err)
  })
})
