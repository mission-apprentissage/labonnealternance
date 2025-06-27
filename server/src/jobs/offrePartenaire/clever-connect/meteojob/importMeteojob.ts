import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawMeteojobModel from "shared/models/rawMeteojob.model"

import config from "@/config"
import { veritoneJobToJobsPartners, ZVeritoneJob } from "@/jobs/offrePartenaire/clever-connect/veritoneMapper"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

const rawCollectionName = rawMeteojobModel.collectionName
const offerXmlTag = "job"

export const importMeteojobRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, partnerLabel: JOBPARTNERS_LABEL.METEOJOB })
  } else {
    await importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.cleverConnect.meteojobUrl, offerXmlTag, partnerLabel: JOBPARTNERS_LABEL.METEOJOB })
  }
}

export const importMeteojobToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.METEOJOB,
    zodInput: ZVeritoneJob,
    mapper: (job) => veritoneJobToJobsPartners(job, JOBPARTNERS_LABEL.METEOJOB),
    documentJobRoot: offerXmlTag,
  })
}
