import { ApiClient } from "api-alternance-sdk"
import { ObjectId } from "bson"
import type { IFTJob } from "shared/models"

import { searchForFtJobs } from "@/common/apis/franceTravail/franceTravail.client"
import { logger } from "@/common/logger"
import { sleep } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"

// Documentation https://francetravail.io/produits-partages/catalogue/offres-emploi/documentation#/api-reference/operations/recupererListeOffre

async function getAllFTJobs(departement: string) {
  const jobLimit = 150
  let start = 0
  let total = 1

  let allJobs = [] as Omit<IFTJob, "_id" | "createdAt">[]

  while (start < total) {
    // Construct the range for this "page"
    const range = `${start}-${start + jobLimit - 1}`

    // Prepare your query params
    const params: Parameters<typeof searchForFtJobs>[0] = {
      natureContrat: "E2,FS", // E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation
      range,
      departement,
      // publieeDepuis: 7, // Il vaut mieux ne pas mettre de date de publication pour avoir le plus de résultats possible
      sort: 1, // making sure we get the most recent jobs first
    }

    try {
      const response = await searchForFtJobs(params, { throwOnError: true })
      await sleep(1500)
      if (!response) {
        throw new Error("No response from FranceTravail")
      }

      const { data: jobs, contentRange } = response

      if (!jobs.resultats) {
        //  logger.info("No resultats from FranceTravail", params)
        break
      }

      allJobs = [...allJobs, ...(jobs.resultats as Omit<IFTJob, "_id" | "createdAt">[])]

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
      // handle 3000 limit page reach
      if (error.response?.data?.message === "La position de début doit être inférieure ou égale à 3000.") {
        sentryCaptureException(error)
        await notifyToSlack({
          subject: "Import Offres France Travail",
          message: `Limite des 3000 offres par département dépassée! dept: ${departement} total: ${total}`,
          error: true,
        })
        throw error
      }
      if (error.response?.data?.message === "Valeur du paramètre « region » incorrecte." || error.response?.data?.message === "Valeur du paramètre « departement » incorrecte.") {
        // code region or departement not found
        break
      }
      logger.error("Error while fetching jobs", error)
    }
  }
  return allJobs
}

export const importFranceTravailJobs = async () => {
  const apiClient = new ApiClient({
    key: config.apiApprentissage.apiKey,
  })
  const departements = await apiClient.geographie.listDepartements()
  const codesDepartements = departements.map((d) => d.codeInsee)

  let allJobs = [] as Omit<IFTJob, "_id" | "createdAt">[]
  for (const codeDepartement of codesDepartements) {
    const jobs = await getAllFTJobs(codeDepartement)
    allJobs = [...allJobs, ...jobs]
  }

  await getDbCollection("raw_francetravail").updateMany(
    { id: { $nin: allJobs.map(({ id }) => id) } as any, unpublishedAt: { $exists: false } },
    { $set: { unpublishedAt: new Date(), updatedAt: new Date() } }
  )

  for (const rawFtJob of allJobs) {
    await getDbCollection("raw_francetravail").findOneAndUpdate(
      { id: rawFtJob.id as string },
      {
        $set: { ...rawFtJob, updatedAt: new Date() },
        $setOnInsert: { _id: new ObjectId(), createdAt: new Date() },
      },
      { upsert: true }
    )
  }
}
