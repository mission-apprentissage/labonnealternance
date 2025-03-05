import { Filter } from "mongodb"
import jobsPartnersModel, { IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { blockBadRomeJobsPartners } from "@/jobs/offrePartenaire/blockBadRomeJobsPartners"
import { fillLocationInfosForPartners } from "@/jobs/offrePartenaire/fillLocationInfosForPartners"
import { fillOpcoInfosForPartners } from "@/jobs/offrePartenaire/fillOpcoInfosForPartners"
import { removeMissingRecruteursLbaFromRaw } from "@/jobs/offrePartenaire/recruteur-lba/importRecruteursLbaRaw"
import { validateComputedJobPartners } from "@/jobs/offrePartenaire/validateComputedJobPartners"

const filter: Filter<IComputedJobsPartners | IJobsPartnersOfferPrivate> = {
  partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
}

export const fillComputedRecruteursLba = async () => {
  await removeMissingRecruteursLbaFromRaw()
  await fillOpcoInfosForPartners(filter)
  await fillLocationInfosForPartners(filter)
  await blockBadRomeJobsPartners(filter)
  await validateComputedJobPartners(filter)
}

export const importRecruteursLbaFromComputedToJobsPartners = async () => {
  logger.info("suppression des recruteurs_lba de jobs_partners")
  await getDbCollection("jobs_partners").deleteMany(filter as IJobsPartnersOfferPrivate)
  logger.info("import des recruteurs_lba dans jobs_partners")
  await getDbCollection("computed_jobs_partners")
    .aggregate([
      { $match: { ...filter, business_error: null, validated: true } },
      {
        $unset: ["validated", "business_error", "errors", "currently_processed_id", "jobs_in_success"],
      },
      { $merge: jobsPartnersModel.collectionName },
    ])
    .toArray()
  const verifyCount = await getDbCollection("jobs_partners").countDocuments(filter as IJobsPartnersOfferPrivate)
  const message = `import des recruteurs_lba dans jobs_partners terminé. total=${verifyCount}`
  logger.info(message)
  await notifyToSlack({
    subject: `jobsPartners: import de données`,
    message,
  })
}
