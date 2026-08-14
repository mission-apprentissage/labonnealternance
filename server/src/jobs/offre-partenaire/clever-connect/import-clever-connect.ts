import type { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { CollectionName } from "shared/models/models"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offre-partenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { cleverConnectJobToJobsPartners, ZCleverConnectJob } from "./clever-connect-mapper"

const offerXmlTag = "job"

export const importCleverConnectRaw = async (destinationCollection: CollectionName, partnerLabel: JOBPARTNERS_LABEL, url?: string, sourceStream?: NodeJS.ReadableStream) => {
  if (!url && !sourceStream) throw new Error("url or sourceStream is required")

  if (sourceStream) {
    return importFromStreamInXml({ destinationCollection, offerXmlTag, stream: sourceStream, importName: partnerLabel })
  }
  if (url) {
    return importFromUrlInXml({ destinationCollection, url, offerXmlTag, partnerLabel })
  }
}

export const importCleverConnectToComputed = async (collectionSource: CollectionName, partnerLabel: JOBPARTNERS_LABEL) => {
  return rawToComputedJobsPartners({
    collectionSource,
    partnerLabel,
    zodInput: ZCleverConnectJob,
    mapper: (job) => cleverConnectJobToJobsPartners(job, partnerLabel),
    documentJobRoot: offerXmlTag,
  })
}
