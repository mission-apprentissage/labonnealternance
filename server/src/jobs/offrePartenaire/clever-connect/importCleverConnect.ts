import type { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { CollectionName } from "shared/models/models"

import { cleverConnectJobToJobsPartners, ZCleverConnectJob } from "./cleverConnectMapper"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

const offerXmlTag = "job"

export const importCleverConnectRaw = async (destinationCollection: CollectionName, partnerLabel: JOBPARTNERS_LABEL, url?: string, sourceStream?: NodeJS.ReadableStream) => {
  if (!url && !sourceStream) throw new Error("url or sourceStream is required")

  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection, offerXmlTag, stream: sourceStream, partnerLabel })
  }
  if (url) {
    await importFromUrlInXml({ destinationCollection, url, offerXmlTag, partnerLabel })
  }
}

export const importCleverConnectToComputed = async (collectionSource: CollectionName, partnerLabel: JOBPARTNERS_LABEL) => {
  await rawToComputedJobsPartners({
    collectionSource,
    partnerLabel,
    zodInput: ZCleverConnectJob,
    mapper: (job) => cleverConnectJobToJobsPartners(job, partnerLabel),
    documentJobRoot: offerXmlTag,
  })
}
