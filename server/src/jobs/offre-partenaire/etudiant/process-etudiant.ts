import { ObjectId } from "bson"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawEtudiantModel from "shared/models/raw-etudiant.model"
import { getJobEtudiantJobs, ZJobEtudiantJob } from "@/common/apis/etudiant/etudiant.client"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
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

  const message = `import ${partnerLabel} terminé : ${jobs.length} offres importées`
  logger.info(message)
  await notifyToSlack({
    subject: `import des offres ${partnerLabel} dans raw`,
    message,
  })
}

export const importEtudiantToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel,
    zodInput: ZJobEtudiantJob,
    mapper: etudiantJobToJobsPartners,
    rawFilterQuery: { "contract.translation.fr": ETUDIANT_ELIGIBLE_CONTRACT_FR },
  })
}

export const processEtudiant = async () => {
  await importEtudiantRaw()
  await importEtudiantToComputed()
}
