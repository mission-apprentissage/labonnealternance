import __dirname from "../../common/dirname.js"
import { ConvertedFormation_0 } from "../../common/model/index.js"
import { asyncForEach } from "../../common/utils/asyncUtils.js"
import { createXLSXFile } from "../../common/utils/fileUtils.js"
import { runScript } from "../scriptWrapper.js"
import jeunes from "./jeunes.json" assert { type: "json" }

runScript(async () => {
  const buffer = []

  await asyncForEach(jeunes, async (jeune) => {
    let formation = []
    formation = await ConvertedFormation_0.find({
      $or: [
        {
          etablissement_formateur_siret: jeune.siret_etablissement,
        },
        {
          etablissement_gestionnaire_siret: jeune.siret_etablissement,
        },
      ],

      cfd: jeune.formation_cfd,
      tags: { $in: ["2022"] },
      published: true,
      catalogue_published: true,
    })

    if (!formation.length) {
      formation = await ConvertedFormation_0.find({
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
    }

    if (formation.length === 1) {
      const x = formation[0]

      if (!x.rome_codes.length || x.lieu_formation_geo_coordonnees === "null" || x.lieu_formation_geo_coordonnees == undefined) {
        return
      }

      const romes = x.rome_codes.toString()
      const [lat, long] = x.lieu_formation_geo_coordonnees.split(",")
      const url = `https://labonnealternance.apprentissage.beta.gouv.fr/recherche-emploi?&display=list&romes=${romes}&radius=60&lat=${lat}&lon=${long}8&utm_source=campagne-mna&utm_medium=email&utm_campaign=jeunessanscontrat1222`

      buffer.push({
        email: jeune.email_contact,
        lien: url,
        prenom: jeune.prenom_apprenant,
        libelle_formation: jeune.libelle_long_formation,
        siret: jeune.siret_etablissement,
      })
    }
  })

  const filePath = __dirname(import.meta.url)

  createXLSXFile(buffer, `${filePath}/jeunes.xlsx`)
})
