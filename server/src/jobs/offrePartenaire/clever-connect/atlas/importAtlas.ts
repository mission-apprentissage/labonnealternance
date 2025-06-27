import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawAtlasModel from "shared/models/rawAtlas.model"

import config from "@/config"
import { veritoneJobToJobsPartners, ZVeritoneJob } from "@/jobs/offrePartenaire/clever-connect/veritoneMapper"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

const rawCollectionName = rawAtlasModel.collectionName
const offerXmlTag = "job"

export const importAtlasRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, partnerLabel: JOBPARTNERS_LABEL.ATLAS })
  } else {
    await importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.cleverConnect.atlasUrl, offerXmlTag, partnerLabel: JOBPARTNERS_LABEL.ATLAS })
  }
}

export const importAtlasToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.ATLAS,
    zodInput: ZVeritoneJob,
    mapper: (job) => veritoneJobToJobsPartners(job, JOBPARTNERS_LABEL.ATLAS),
    documentJobRoot: offerXmlTag,
  })
}
