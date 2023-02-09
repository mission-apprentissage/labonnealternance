import axios from "axios"
import { getConfig } from "../utils/config"

export default async function sendTrainingOpenedEventToCatalogue(cleMinistereEducatif) {
  if (!cleMinistereEducatif) return

  const { env } = getConfig()

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
