import fs from "node:fs/promises"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { parseCsvContent } from "@/common/utils/fileUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { ajoutRomesADomaineMetiers, deleteRomeFromDomaineMetier } from "@/jobs/domainesMetiers/domaineMetiersFixRomes"

export const up = async () => {
  const filepath = getStaticFilePath("referentiel/labonnealternance.referentielromes_classification_new_21.01.26.csv")
  const content = (await fs.readFile(filepath)).toString()
  const parsedCsv = await parseCsvContent(content, { delimiter: ";" })
  console.log(parsedCsv)
  const data = parsedCsv as {
    code: string
    sousDomaine: string
    "Sous-domaine à ajouter": string
    "Sous-domaine à supprimer": string
  }[]
  await asyncForEach(data, async (line) => {
    console.info("treating line", line)
    const { code: codeRome, sousDomaine } = line
    const aSupprimer: boolean = line["Sous-domaine à supprimer"].length > 0

    if (aSupprimer) {
      await deleteRomeFromDomaineMetier(codeRome, sousDomaine)
    } else {
      await ajoutRomesADomaineMetiers(
        {
          [sousDomaine]: [codeRome],
        },
        false
      )
    }
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
