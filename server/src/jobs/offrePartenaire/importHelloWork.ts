import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { helloWorkJobToJobsPartners, ZHelloWorkJob } from "./helloWorkMapper"
import { importFromUrlInXml } from "./importFromUrlInXml"
import { rawToComputedJobsPartners } from "./rawToComputedJobsPartners"

export const importHelloWork = async () => {
  await importFromUrlInXml({ destinationCollection: "raw_hellowork", url: "plop", offerXmlTag: "job" })
  await rawToComputedJobsPartners({
    collectionSource: "raw_hellowork",
    partnerLabel: JOBPARTNERS_LABEL.HELLOWORK,
    zodInput: ZHelloWorkJob,
    mapper: helloWorkJobToJobsPartners,
    documentJobRoot: "job",
  })
}
