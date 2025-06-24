import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawAtlasModel from "shared/models/rawAtlas.model"

import config from "@/config"
import { atlasJobToJobsPartners, ZAtlasJob } from "@/jobs/offrePartenaire/atlas/atlasMapper"

import { importFromStreamInXml } from "../importFromStreamInXml"
import { importFromUrlInXml } from "../importFromUrlInXml"
import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

const rawCollectionName = rawAtlasModel.collectionName
const offerXmlTag = "job"

export const importAtlasRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, partnerLabel: JOBPARTNERS_LABEL.ATLAS })
  } else {
    await importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.atlasUrl, offerXmlTag, partnerLabel: JOBPARTNERS_LABEL.ATLAS })
  }
}

export const importAtlasToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.ATLAS,
    zodInput: ZAtlasJob,
    mapper: atlasJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
