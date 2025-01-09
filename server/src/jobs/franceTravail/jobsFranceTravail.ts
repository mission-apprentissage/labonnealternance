import { ApiClient } from "api-alternance-sdk"

import { searchForFtJobs } from "@/common/apis/franceTravail/franceTravail.client"
import { sleep } from "@/common/utils/asyncUtils"
import config from "@/config"
import { FTJob } from "@/services/ftjob.service.types"

async function getAllFTJobs(region: string) {
  const jobLimit = 150
  let start = 0
  let total = 1

  let allJobs = [] as FTJob[]
  let nbRequests = 0

  while (start < total) {
    // Construct the range for this "page"
    const range = `${start}-${start + jobLimit - 1}`

    // Prepare your query params
    const params: Parameters<typeof searchForFtJobs>[0] = {
      natureContrat: "E2,FS", // E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation
      range,
      region,
      // publieeDepuis: 7,
    }

    try {
      const response = await searchForFtJobs(params, { throwOnError: true })
      await sleep(1000)
      if (!response) {
        throw new Error("No response from FranceTravail")
      }

      const { data: jobs, contentRange } = response

      if (!jobs.resultats) {
        console.log("No resultats from FranceTravail", params)
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
      nbRequests++
      console.log(region, range, allJobs.length, total, nbRequests)
    } catch (error: any) {
      if (error.response?.data?.message === "Valeur du paramètre « region » incorrecte.") {
        // code region not found
        break
      }
      console.error("Error while fetching jobs", error)
    }
  }

  return allJobs
}

export const getFranceTravailJobs = async () => {
  const apiClient = new ApiClient({
    key: config.apiApprentissage.apiKey,
  })
  const departements = await apiClient.geographie.listDepartements()
  const regions = [...new Set(departements.map((d) => d.region.codeInsee))]

  let allJobs = [] as FTJob[]
  for (const region of regions) {
    const jobs = await getAllFTJobs(region)
    allJobs = [...allJobs, ...jobs]
  }
  console.log(allJobs.length)
}
