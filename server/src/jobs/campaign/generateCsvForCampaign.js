import got from "got"
import { asyncForEach } from "../../common/utils/asyncUtils.js"
import config from "../../config.js"
import { runScript } from "../scriptWrapper.js"
import jeunes from "./jeunes.json" assert { type: "json" }

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getCatalogueFormations = (query = {}, select = {}) =>
  got(`${config.catalogueUrl}/api/v1/entity/formations`, {
    method: "POST",
    json: {
      query,
      select,
      limit: 1000,
    },
  }).json()

runScript(async () => {
  const first = jeunes.slice(0, 10)

  await asyncForEach(first, async (jeune) => {
    const formation = await getCatalogueFormations({
      cfd: jeune.formation_cfd,
      etablissement_gestionnaire_siret: jeune.etablissement_siret,
      etablissement_gestionnaire_uai: jeune.uai_etablissement,
      published: true,
      catalogue_published: true,
    })

    console.log({ jeune: jeune.formation_rncp, siret: jeune.siret_etablissement, catalogue: formation.pagination.total })

    await delay(1000)
  })
})
