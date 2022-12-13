import { ConvertedFormation_0 } from "../../common/model/index.js"
import { runScript } from "../scriptWrapper.js"
import jeunes from "./jeunes.json" assert { type: "json" }

runScript(async () => {
  const first = jeunes.slice(0, 10)
  const stat = {
    noMatch: 0,
    exactMatch: 0,
    multiMatch: 0,
  }

  await Promise.all(
    jeunes.map(async (jeune) => {
      const formation = await ConvertedFormation_0.find({
        etablissement_formateur_uai: jeune.uai_etablissement,
        cfd: jeune.formation_cfd,
        published: true,
        catalogue_published: true,
      })

      switch (formation.length) {
        case 0:
          stat.noMatch++
          break
        case 1:
          stat.exactMatch++
          break

        default:
          stat.multiMatch++
          break
      }
    })
  )
  console.log(stat)
})
