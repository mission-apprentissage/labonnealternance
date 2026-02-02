import fs from "node:fs/promises"
import { deduplicate } from "@/common/utils/array"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { parseCsvContent } from "@/common/utils/fileUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { deleteRomeFromDomaineMetier, ajoutRomesADomaineMetiers } from "@/jobs/domainesMetiers/domaineMetiersFixRomes"

export const up = async () => {
  const filepath = getStaticFilePath("referentiel/romes renommées_changement de sous-domaines.csv")
  const content = (await fs.readFile(filepath)).toString()
  const parsedCsv = await parseCsvContent(content, { delimiter: "," })
  const data = parsedCsv as {
    "Code ROME": string
    "Ancien sous-domaine": string
    "Nouveau sous-domaine": string
  }[]

  const todos: Record<
    string,
    {
      codeRome: string
      sousDomaineAEnlever: string[]
      sousDomaineAAjouter: string[]
    }
  > = {}

  data.forEach((line) => {
    const codeRome = line["Code ROME"]
    const ancienSousDomaine = line["Ancien sous-domaine"]
    const nouveauSousDomaine = line["Nouveau sous-domaine"]

    let romeData = todos[codeRome]
    if (!romeData) {
      romeData = {
        codeRome,
        sousDomaineAAjouter: [],
        sousDomaineAEnlever: [],
      }
      todos[codeRome] = romeData
    }
    romeData.sousDomaineAEnlever.push(ancienSousDomaine)
    romeData.sousDomaineAAjouter.push(nouveauSousDomaine)
  })
  const values = Object.values(todos)
  values.forEach((romeObj) => {
    const { sousDomaineAAjouter, sousDomaineAEnlever } = romeObj
    romeObj.sousDomaineAEnlever = deduplicate(sousDomaineAEnlever.filter((x) => !sousDomaineAAjouter.includes(x)))
    romeObj.sousDomaineAAjouter = deduplicate(sousDomaineAAjouter)
  })

  await asyncForEach(values, async (todo) => {
    const { codeRome, sousDomaineAAjouter, sousDomaineAEnlever } = todo
    console.info("treating", todo)

    console.info("suppression des sous domaines", sousDomaineAEnlever)
    await asyncForEach(sousDomaineAEnlever, async (sousDomaine) => {
      await deleteRomeFromDomaineMetier(codeRome, sousDomaine)
    })

    console.info("ajout pour les sous domaines", sousDomaineAAjouter)
    const ajoutSousDomaineRecord = Object.fromEntries(sousDomaineAAjouter.map((sousDomaine) => [sousDomaine, [codeRome]]))
    await ajoutRomesADomaineMetiers(ajoutSousDomaineRecord, false)

    console.info("fin du traitement du rome", codeRome)
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
