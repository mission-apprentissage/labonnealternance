import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawKelioModel from "shared/models/raw-kelio.model"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { importFromUrlInXml } from "@/jobs/offre-partenaire/import-from-url-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { kelioJobToJobsPartners, ZKelioJob } from "./kelio-mapper"

const rawCollectionName = rawKelioModel.collectionName
const offerXmlTag = "job"

export const importKelioRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      importName: JOBPARTNERS_LABEL.KELIO,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    await importFromUrlInXml({
      destinationCollection: rawCollectionName,
      url: config.kelioUrl,
      offerXmlTag,
      partnerLabel: JOBPARTNERS_LABEL.KELIO,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importKelioToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.KELIO,
    zodInput: ZKelioJob,
    mapper: kelioJobToJobsPartners,
    documentJobRoot: offerXmlTag,
    rawFilterQuery: { "job.job_type": { $in: ["Alternating", "Professional Contract"] } },
  })
}
