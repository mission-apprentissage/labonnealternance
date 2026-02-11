import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawPassModel from "shared/models/rawPass.model"

import { passJobToJobsPartners, ZPassJob } from "./passMapper"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

const rawCollectionName = rawPassModel.collectionName
const offerXmlTag = "item"

export const importPassRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, importName: JOBPARTNERS_LABEL.PASS })
  } else {
    await importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.passUrl, offerXmlTag, partnerLabel: JOBPARTNERS_LABEL.PASS })
  }
}

export const importPassToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.PASS,
    zodInput: ZPassJob,
    mapper: passJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
