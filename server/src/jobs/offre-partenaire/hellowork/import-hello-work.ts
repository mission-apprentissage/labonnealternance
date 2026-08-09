import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawHelloWorkModel from "shared/models/raw-hello-work.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offre-partenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { helloWorkJobToJobsPartners, ZHelloWorkJob } from "./hello-work-mapper"

const rawCollectionName = rawHelloWorkModel.collectionName
const offerXmlTag = "job"

export const importHelloWorkRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.HELLOWORK,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    await importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.helloworkUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.HELLOWORK,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importHelloWorkToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.HELLOWORK,
    zodInput: ZHelloWorkJob,
    mapper: helloWorkJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
