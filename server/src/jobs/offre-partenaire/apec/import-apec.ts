import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawApecModel from "shared/models/raw-apec.model"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { apecJobToJobsPartners, ZApecJob } from "./apec-mapper"

const rawCollectionName = rawApecModel.collectionName
const offerXmlTag = "Offre_emploi"

export const importApecRaw = async (sourceStream: NodeJS.ReadableStream) => {
  await importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.APEC,
    conflictingOpeningTagWithoutAttributes: true,
  })
}

export const importApecToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.APEC,
    zodInput: ZApecJob,
    mapper: apecJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
