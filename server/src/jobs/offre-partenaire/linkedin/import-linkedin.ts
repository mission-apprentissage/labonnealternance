import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import rawLinkedinModel from "shared/models/raw-linkedin.model"
import { importFromStreamInXml } from "@/jobs/offre-partenaire/import-from-stream-in-xml"
import { rawToComputedJobsPartners } from "@/jobs/offre-partenaire/raw-to-computed-jobs-partners"
import { linkedinJobToJobsPartners, ZLinkedinJob } from "./linkedin-mapper"

const rawCollectionName = rawLinkedinModel.collectionName
const offerXmlTag = "job"

export const importLinkedinRaw = async (sourceStream: NodeJS.ReadableStream) => {
  return importFromStreamInXml({
    destinationCollection: rawCollectionName,
    offerXmlTag,
    stream: sourceStream,
    importName: JOBPARTNERS_LABEL.LINKEDIN,
    // Sans ce flag, la balise d'ouverture recherchée est `<job` : elle matcherait la racine
    // `<jobs>` du flux. Avec, on cherche `<job>` exactement — les offres n'ont pas d'attributs.
    conflictingOpeningTagWithoutAttributes: true,
  })
}

export const importLinkedinToComputed = async () => {
  return rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.LINKEDIN,
    zodInput: ZLinkedinJob,
    mapper: linkedinJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
