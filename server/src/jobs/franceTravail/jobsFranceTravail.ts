import { ApiClient } from "api-alternance-sdk"

import { searchForFtJobs } from "@/common/apis/franceTravail/franceTravail.client"
import { logger } from "@/common/logger"
import { sleep } from "@/common/utils/asyncUtils"
// import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"
import { FTJob } from "@/services/ftjob.service.types"

async function getAllFTJobs(departement: string) {
  const jobLimit = 150
  let start = 0
  let total = 1

  let allJobs = [] as FTJob[]

  while (start < total) {
    // Construct the range for this "page"
    const range = `${start}-${start + jobLimit - 1}`

    // Prepare your query params
    const params: Parameters<typeof searchForFtJobs>[0] = {
      natureContrat: "E2,FS", // E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation
      range,
      departement,
      publieeDepuis: 7,
      sort: 1, // making sure we get the most recent jobs first
    }

    try {
      const response = await searchForFtJobs(params, { throwOnError: true })
      await sleep(500)
      if (!response) {
        throw new Error("No response from FranceTravail")
      }

      const { data: jobs, contentRange } = response

      if (!jobs.resultats) {
        //  logger.info("No resultats from FranceTravail", params)
        break
      }

      allJobs = [...allJobs, ...jobs.resultats]

      // Safely parse out the total
      // Usually, contentRange might look like "offres 0-149/9981"
      // We split by "/" and take the second part (9981), converting to Number
      if (contentRange) {
        const totalString = contentRange.split("/")[1]
        if (totalString) {
          total = parseInt(totalString, 10)
        }
      }

      // Move to the next "page"
      start += jobLimit
    } catch (error: any) {
      if (error.response?.data?.message === "Valeur du paramètre « region » incorrecte." || error.response?.data?.message === "Valeur du paramètre « departement » incorrecte.") {
        // code region or departement not found
        break
      }
      logger.error("Error while fetching jobs", error)
    }
  }
  logger.info(departement, allJobs.length, total)
  return allJobs
}

export const getFranceTravailJobs = async () => {
  const apiClient = new ApiClient({
    key: config.apiApprentissage.apiKey,
  })
  const departements = await apiClient.geographie.listDepartements()
  const codesDepartements = departements.map((d) => d.codeInsee)

  let allJobs = [] as FTJob[]
  for (const codeDepartement of codesDepartements) {
    const jobs = await getAllFTJobs(codeDepartement)
    allJobs = [...allJobs, ...jobs]
  }
  logger.info(allJobs.length)

  // const rawFranceTravailDocuments = await getDbCollection("raw_francetravail").find({}).toArray()
}

// TODO
// fall safe 30 jours if we have an error
// TOTAL RANGE - 30 jours
// Throw 3000 jobs
