import { readFile } from "node:fs/promises"
import path from "node:path"

import __dirname from "@/common/dirname"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getHttpClient } from "@/common/utils/httpUtils"
import config from "@/config"

const apiParams = {
  token: config.entreprise.apiKey,
  context: config.entreprise.context,
  recipient: config.entreprise.recipient, // Siret Dinum
  object: config.entreprise.object,
}

const getEtablissementDiffusibles = async (siret: string): Promise<any | null> => {
  try {
    const { data } = await getHttpClient({ timeout: 5000 }).get<any>(`https://entreprise.api.gouv.fr/v3/insee/sirene/etablissements/${encodeURIComponent(siret)}/adresse`, {
      params: apiParams,
    })
    return data
  } catch (error: any) {
    return { data: null }
  }
}

export const testSiretsLba = async () => {
  const sirets = JSON.parse(await readFile(path.resolve(getStaticFilePath("./labonnealternance.tmp_siret.json")), { encoding: "utf-8" }))

  const siretsWithError: string[] = []
  for (const { _id: siret } of sirets) {
    const { data } = await getEtablissementDiffusibles(siret)
    if (data && data.status_diffusion !== "diffusible") {
      console.log({ ...data, siret })
      siretsWithError.push({ ...data, siret })
    }
  }

  console.log(siretsWithError)
}
