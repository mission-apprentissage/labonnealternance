import axios from "axios"
import config from "../../config.js"

export default () => ({
  getApplication: async (offreId) => {
    const result = await axios.get(`https://labonnealternance${config.env === "production" ? "" : "-recette"}.apprentissage.beta.gouv.fr/api/application/search`, {
      headers: {
        Application: config.lba.application,
        "API-key": config.lba.apiKey,
      },
      params: { query: JSON.stringify({ job_id: offreId }) },
    })

    return result
  },
})
