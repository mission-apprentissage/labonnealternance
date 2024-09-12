import { ObjectId } from "mongodb"
import { IJob } from "shared"
import { RECRUITER_STATUS } from "shared/constants"

import { getDbCollection } from "../../common/utils/mongodbUtils"

type IDuplicate = {
  _id: string
  jobs_count: number
  status: string
  jobs: IJob[]
}
type IDuplicatedRecruiters = {
  establishment_siret: string
  email: string
  duplicates: IDuplicate[]
}

async function mergeJobs(primaryDuplicate: IDuplicate, duplicatesToMerge: IDuplicatedRecruiters["duplicates"]) {
  // Créer un ensemble pour stocker les combinaisons de jobs uniques
  const uniqueJobCombinations = new Set()

  // Ajouter les jobs du premier doublon à l'ensemble
  primaryDuplicate.jobs.forEach((job) => {
    const jobPattern = generateJobPattern(job)
    uniqueJobCombinations.add(jobPattern)
  })

  // Fusionner les jobs des autres doublons
  duplicatesToMerge.forEach((duplicate) => {
    duplicate.jobs.forEach((job) => {
      const jobPattern = generateJobPattern(job)
      // Si la combinaison n'existe pas, ajouter le job au doublon principal
      if (!uniqueJobCombinations.has(jobPattern)) {
        primaryDuplicate.jobs.push(job)
        uniqueJobCombinations.add(jobPattern)
      } else {
        console.log("Pattern found, job not added :", jobPattern)
      }
    })
  })
  // Mettre à jour le doublon principal dans la base de données
  await getDbCollection("recruiters").updateOne({ _id: new ObjectId(primaryDuplicate._id) }, { $set: { jobs: primaryDuplicate.jobs } })
}

function generateJobPattern(job: IJob) {
  // Générer une clé unique pour identifier un job
  return `${job.rome_label}-${job.rome_appellation_label}-${job.job_level_label}`
}

export async function removeDuplicateRecruiters() {
  const recruiters = (await getDbCollection("recruiters")
    .aggregate([
      {
        $group: {
          _id: {
            establishment_siret: "$establishment_siret",
            email: "$email",
          },
          count: { $sum: 1 },
          documents: {
            $push: {
              _id: "$_id",
              jobs_count: { $size: { $ifNull: ["$jobs", []] } },
              status: "$status",
              jobs: "$jobs",
            },
          },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          establishment_siret: "$_id.establishment_siret",
          email: "$_id.email",
          duplicates: "$documents",
        },
      },
      {
        $sort: { email: 1 },
      },
    ])
    .toArray()) as IDuplicatedRecruiters[]

  for await (const recruiter of recruiters) {
    const { duplicates } = recruiter
    // Trouver le premier doublon actif (si existe)
    const firstActiveDuplicate = duplicates.find((duplicate) => duplicate.status === RECRUITER_STATUS.ACTIF)

    // Traiter les doublons actifs
    if (firstActiveDuplicate) {
      // Filtrer les doublons avec job_count > 0
      const activeJobsDuplicates = duplicates.filter((duplicate) => duplicate.jobs_count > 0 && duplicate._id.toString() !== firstActiveDuplicate._id.toString())

      // Fusionner les jobs si nécessaire
      if (activeJobsDuplicates.length > 1) {
        mergeJobs(firstActiveDuplicate, activeJobsDuplicates)
      }
      // Supprimer les doublons actifs restants avec ou sans job
      await Promise.all(
        duplicates
          .filter((duplicate) => duplicate._id.toString() !== firstActiveDuplicate._id.toString())
          .map(async (duplicate) => await getDbCollection("recruiters").deleteOne({ _id: new ObjectId(duplicate._id) }))
      )
    }
    // Si tous les doublons inactif restant n'ont pas de job, on garde le premier et on supprime le reste.
    if (duplicates.every((duplicate) => duplicate.jobs_count === 0)) {
      duplicates.shift()
      await Promise.all(duplicates.map(async (duplicate) => await getDbCollection("recruiters").deleteOne({ _id: new ObjectId(duplicate._id) })))
      continue
    }
    // Si doublon inactif avec job, on garde le premier et on merge tous les jobs
    const firstInactiveDuplicate = duplicates.shift()!
    mergeJobs(firstInactiveDuplicate, duplicates)
    // Supprimer les doublons restants
    await Promise.all(duplicates.map(async (duplicate) => await getDbCollection("recruiters").deleteOne({ _id: new ObjectId(duplicate._id) })))
  }
}
