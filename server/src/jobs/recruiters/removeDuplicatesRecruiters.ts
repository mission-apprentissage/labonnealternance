import { ObjectId } from "mongodb"
import { IJob } from "shared"
import { RECRUITER_STATUS } from "shared/constants"

import { getDbCollection } from "../../common/utils/mongodbUtils"

type IDuplicate = {
  _id: string
  jobs_count: number
  status: string
  managedBy: string
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
      if (!uniqueJobCombinations.has(jobPattern)) {
        // Si la combinaison n'existe pas, ajouter le job au doublon principal
        primaryDuplicate.jobs.push(job)
        uniqueJobCombinations.add(jobPattern)
      }
    })
  })
  // Mettre à jour le doublon principal dans la base de données
  await getDbCollection("recruiters").updateOne({ _id: new ObjectId(primaryDuplicate._id) }, { $set: { jobs: primaryDuplicate.jobs } })

  // Supprimer les doublons de l'ensemble des doublons à fusionner
  for await (const duplicate of duplicatesToMerge) {
    await getDbCollection("recruiters").deleteOne({ _id: new ObjectId(duplicate._id) })
  }
}

function generateJobPattern(job: IJob) {
  // Générer une clé unique pour identifier un job
  return `${job.rome_label}-${job.rome_appellation_label}-${job.job_level_label}`
}

export async function removeDuplicateRecruiters() {
  const recruiters = (await getDbCollection("recruiters")
    .aggregate([
      [
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
                managedBy: "$managed_by",
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
      ],
    ])
    .toArray()) as IDuplicatedRecruiters[]

  for await (const recruiter of recruiters) {
    // Trouver le premier doublon actif (si existe)
    const firstActiveDuplicate = recruiter.duplicates.find((duplicate) => duplicate.status === RECRUITER_STATUS.ACTIF)
    // Traiter les doublons actifs
    if (firstActiveDuplicate) {
      // Filtrer les doublons avec job_count > 0
      const activeJobsDuplicates = recruiter.duplicates.filter((duplicate) => duplicate.status === RECRUITER_STATUS.ACTIF && duplicate.jobs_count > 0)
      // Fusionner les jobs si nécessaire
      if (activeJobsDuplicates.length > 1) {
        mergeJobs(firstActiveDuplicate, activeJobsDuplicates)
      }
      // Supprimer les doublons actifs restants
      recruiter.duplicates = recruiter.duplicates.filter((duplicate) => duplicate._id === firstActiveDuplicate._id)
    }
    // Traiter les doublons inactifs et les autres
    for await (const duplicate of recruiter.duplicates) {
      if (duplicate.jobs_count > 0) {
        // Fusionner les jobs dans le premier doublon actif (s'il existe) ou le premier doublon
        if (firstActiveDuplicate) {
          mergeJobs(firstActiveDuplicate, [duplicate])
        } else {
          mergeJobs(recruiter.duplicates[0], [duplicate])
        }
      } else {
        // Supprimer le doublon
        await getDbCollection("recruiters").deleteOne({ _id: new ObjectId(duplicate._id) })
      }
    }
  }
}
