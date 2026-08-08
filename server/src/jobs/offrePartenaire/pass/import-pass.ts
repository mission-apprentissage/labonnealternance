import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawPassModel from "shared/models/raw-pass.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/raw-to-computed-jobs-partners"
import { passJobToJobsPartners, ZPassJob } from "./pass-mapper"

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
