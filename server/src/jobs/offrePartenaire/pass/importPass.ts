import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawPassModel from "shared/models/rawPass.model"

import config from "../../../config"
import { importFromUrlInXml } from "../importFromUrlInXml"
import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

import { passJobToJobsPartners, ZPassJob } from "./passMapper"

const rawCollectionName = rawPassModel.collectionName
const offerXmlTag = "item"

export const importPassRaw = async () => await importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.passUrl, offerXmlTag })

export const importPassToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.HELLOWORK,
    zodInput: ZPassJob,
    mapper: passJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
