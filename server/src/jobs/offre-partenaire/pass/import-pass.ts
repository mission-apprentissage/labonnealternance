import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawPassModel from "shared/models/raw-pass.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offre-partenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { passJobToJobsPartners, ZPassJob } from "./pass-mapper"

const rawCollectionName = rawPassModel.collectionName
const offerXmlTag = "item"

export const importPassRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    return importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, importName: JOBPARTNERS_LABEL.PASS })
  } else {
    return importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.passUrl, offerXmlTag, partnerLabel: JOBPARTNERS_LABEL.PASS })
  }
}

export const importPassToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.PASS,
    zodInput: ZPassJob,
    mapper: passJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
