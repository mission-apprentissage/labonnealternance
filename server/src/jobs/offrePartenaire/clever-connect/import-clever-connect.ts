import type { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { CollectionName } from "shared/models/models"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/raw-to-computed-jobs-partners"
import { cleverConnectJobToJobsPartners, ZCleverConnectJob } from "./clever-connect-mapper"

const offerXmlTag = "job"

export const importCleverConnectRaw = async (destinationCollection: CollectionName, partnerLabel: JOBPARTNERS_LABEL, url?: string, sourceStream?: NodeJS.ReadableStream) => {
  if (!url && !sourceStream) throw new Error("url or sourceStream is required")

  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection, offerXmlTag, stream: sourceStream, importName: partnerLabel })
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
