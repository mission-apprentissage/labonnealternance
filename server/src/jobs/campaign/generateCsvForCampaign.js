import axios from "axios"
import __dirname from "../../common/dirname.js"
import { getDistanceInKm } from "../../common/geolib.js"
import { FormationCatalogue } from "../../common/model/index.js"
import { asyncForEach } from "../../common/utils/asyncUtils.js"
import { createXLSXFile } from "../../common/utils/fileUtils.js"
import { runScript } from "../scriptWrapper.js"
import jeunes from "./jeunes.json" assert { type: "json" }

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

runScript(async () => {
  const buffer = []

  await asyncForEach(jeunes, async (jeune, index, array) => {
    if (!jeune.email_contact) return

    console.log(`${index}/${array.length}`)

    let formation = []

    formation = await FormationCatalogue.find({
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
      formation = await FormationCatalogue.find({
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

    if (formation.length === 0) {
      buffer.push({
        email: jeune.email_contact,
        lien: "https://labonnealternance.apprentissage.beta.gouv.fr&utm_source=campagne-mna&utm_medium=email&utm_campaign=jeunessanscontrat1222",
        prenom: jeune.prenom_apprenant,
        libelle_formation: jeune.libelle_long_formation,
        siret: jeune.siret_etablissement,
      })
    }

    if (formation.length > 1) {
      if (!jeune.code_commune_insee_apprenant) return
      try {
        const {
          data: { features },
        } = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${jeune.code_commune_insee_apprenant}&type=municipality`)

        if (!features.length) {
          buffer.push({
            email: jeune.email_contact,
            lien: "https://labonnealternance.apprentissage.beta.gouv.fr&utm_source=campagne-mna&utm_medium=email&utm_campaign=jeunessanscontrat1222",
            prenom: jeune.prenom_apprenant,
            libelle_formation: jeune.libelle_long_formation,
            siret: jeune.siret_etablissement,
          })
          return
        }

        const [origineLat, origineLong] = features[0].geometry.coordinates

        const distanceBuffer = []
        //prendre la formation la plus proche par rapport à la géoloc trouvé
        formation.map((form) => {
          if (!form.lieu_formation_geo_coordonnees) return

          const [destLong, destLat] = form.lieu_formation_geo_coordonnees.split(",")
          const distanceEnKm = getDistanceInKm({ origin: { latitude: origineLat, longitude: origineLong }, destination: { latitude: destLat, longitude: destLong } })
          distanceBuffer.push({ distance: distanceEnKm, form })
        })

        //récupérer tous les distances, les classer par ordre croissant, prendre le premier.
        distanceBuffer.sort((a, b) => a.distance - b.distance)

        const closestFormation = distanceBuffer[0].form

        if (!closestFormation.rome_codes.length || closestFormation.lieu_formation_geo_coordonnees === "null" || closestFormation.lieu_formation_geo_coordonnees == undefined) {
          return
        }

        const romes = closestFormation.rome_codes.toString()
        const [lat, long] = closestFormation.lieu_formation_geo_coordonnees.split(",")
        const url = `https://labonnealternance.apprentissage.beta.gouv.fr/recherche-emploi?&display=list&romes=${romes}&radius=60&lat=${lat}&lon=${long}&utm_source=campagne-mna&utm_medium=email&utm_campaign=jeunessanscontrat1222`

        buffer.push({
          email: jeune.email_contact,
          lien: url,
          prenom: jeune.prenom_apprenant,
          libelle_formation: jeune.libelle_long_formation,
          siret: jeune.siret_etablissement,
        })

        // Delay calls to avoid BAN from api-adresse.data.gouv.fr
        await delay(800)
      } catch (error) {
        console.log(error)
      }
    }

    if (formation.length === 1) {
      const x = formation[0]

      if (!x.rome_codes.length || x.lieu_formation_geo_coordonnees === "null" || x.lieu_formation_geo_coordonnees == undefined) {
        return
      }

      const romes = x.rome_codes.toString()
      const [lat, long] = x.lieu_formation_geo_coordonnees.split(",")
      const url = `https://labonnealternance.apprentissage.beta.gouv.fr/recherche-emploi?&display=list&romes=${romes}&radius=60&lat=${lat}&lon=${long}&utm_source=campagne-mna&utm_medium=email&utm_campaign=jeunessanscontrat1222`

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
