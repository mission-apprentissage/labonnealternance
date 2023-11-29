import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import __dirname from "@/common/dirname"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { getEtablissementAdreese } from "./entreprise"

export const testSiretsLba = async () => {
  const sirets = JSON.parse(await readFile(path.resolve(getStaticFilePath("./labonnealternance.tmp_siret.json")), { encoding: "utf-8" }))

  const siretsWithError: string[] = []
  for (const [key, { _id: siret }] of sirets.entries()) {
    const adresse = await getEtablissementAdreese(siret)
    if (adresse && adresse.status_diffusion !== "diffusible") {
      console.log({ status_diffusion: adresse.status_diffusion, siret, key })
      siretsWithError.push({ ...adresse, siret, key })
    }
  }

  await writeFile(path.resolve(getStaticFilePath("./result.json")), siretsWithError, { encoding: "utf-8" })
}
