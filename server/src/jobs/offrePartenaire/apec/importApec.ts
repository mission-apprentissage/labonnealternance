import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawApecModel from "shared/models/rawApec.model"
import { apecJobToJobsPartners, ZApecJob } from "./apecMapper"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"

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
