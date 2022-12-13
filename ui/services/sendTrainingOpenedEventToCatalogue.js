import axios from "axios"
import env from "../utils/env"

export default async function sendTrainingOpenedEventToCatalogue(cleMinistereEducatif) {
  if (!cleMinistereEducatif) return

  const catalogueApi = `https://catalogue${env !== "production" ? "-recette" : ""}.apprentissage.beta.gouv.fr/api/stats`
  try {
    if (env !== "local") {
      axios.post(catalogueApi, {
        source: `LBA${env !== "production" ? "-recette" : ""}`,
        cle_ministere_educatif: cleMinistereEducatif,
      })
    }
  } catch (err) {}

  return
}
