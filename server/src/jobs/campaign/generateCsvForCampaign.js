import { ConvertedFormation_0 } from "../../common/model/index.js"
import { runScript } from "../scriptWrapper.js"
import jeunes from "./jeunes.json" assert { type: "json" }

runScript(async () => {
  const first = jeunes.slice(0, 20)
  const stat = {
    noMatch: 0,
    exactMatch: 0,
    multiMatch: 0,
  }

  await Promise.all(
    jeunes.map(async (jeune) => {
      const formation = await ConvertedFormation_0.find({
        $or: [
          {
            etablissement_formateur_siret: jeune.siret_etablissement,
          },
          {
            etablissement_gestionnaire_siret: jeune.siret_etablissement,
          },
        ],
        $or: [
          {
            etablissement_formateur_uai: jeune.uai_etablissement,
          },
          {
            etablissement_gestionnaire_uai: jeune.uai_etablissement,
          },
        ],
        cfd: jeune.formation_cfd,
        tags: { $in: ["2022"] },
        published: true,
        catalogue_published: true,
      })

      console.log({ jeune: jeune.formation_cfd, siret: jeune.siret_etablissement, catalogue: formation.length })

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
