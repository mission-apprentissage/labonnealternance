import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawJobteaserModel from "shared/models/rawJobteaser.model"

import { jobteaserJobToJobsPartners, ZJobteaserJob } from "@/jobs/offrePartenaire/jobteaser/jobteaserMapper"

import config from "../../../config"
import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

const rawCollectionName = rawJobteaserModel.collectionName
const offerXmlTag = "job"

export const importJobteaserRaw = async () => {
  console.log("config", config)
}

export const importJobteaserToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.JOBTEASER,
    zodInput: ZJobteaserJob,
    mapper: jobteaserJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
