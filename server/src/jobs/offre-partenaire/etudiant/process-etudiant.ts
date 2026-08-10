import { ObjectId } from "bson"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawEtudiantModel from "shared/models/raw-etudiant.model"
import { getJobEtudiantJobs, ZJobEtudiantJob } from "@/common/apis/etudiant/etudiant.client"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { ETUDIANT_ELIGIBLE_CONTRACT_FR, etudiantJobToJobsPartners } from "./etudiant.mapper"

const partnerLabel = JOBPARTNERS_LABEL.JOB_ETUDIANT
const rawCollectionName = rawEtudiantModel.collectionName

export const importEtudiantRaw = async () => {
  const now = new Date()

  await getDbCollection(rawCollectionName).deleteMany({})

  logger.info("job-etudiant: récupération des offres")
  const jobs = await getJobEtudiantJobs()

  if (jobs.length > 0) {
    await getDbCollection(rawCollectionName).insertMany(jobs.map((job) => ({ ...job, _id: new ObjectId(), createdAt: now })))
  }

  logger.info(`import ${partnerLabel} terminé : ${jobs.length} offres importées`)
  return { jobCount: jobs.length }
}

export const importEtudiantToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel,
    zodInput: ZJobEtudiantJob,
    mapper: etudiantJobToJobsPartners,
    rawFilterQuery: { "contract.translation.fr": ETUDIANT_ELIGIBLE_CONTRACT_FR },
  })
}

export const processEtudiant = async () => {
  const raw = await importEtudiantRaw()
  const computed = await importEtudiantToComputed()
  return { raw, computed }
}
