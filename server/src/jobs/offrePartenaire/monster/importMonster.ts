import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawMonsterModel from "shared/models/rawMonster.model"

import { monsterJobToJobsPartners, ZMonsterJob } from "./monsterMapper"
import config from "@/config"
import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { importFromUrlInXml } from "@/jobs/offrePartenaire/importFromUrlInXml"
import { rawToComputedJobsPartners } from "@/jobs/offrePartenaire/rawToComputedJobsPartners"


const rawCollectionName = rawMonsterModel.collectionName
const offerXmlTag = "item"

export const importMonsterRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({ destinationCollection: rawCollectionName, offerXmlTag, stream: sourceStream, partnerLabel: JOBPARTNERS_LABEL.MONSTER })
  } else {
    await importFromUrlInXml({ destinationCollection: rawCollectionName, url: config.monsterUrl, offerXmlTag, partnerLabel: JOBPARTNERS_LABEL.MONSTER })
  }
}

export const importMonsterToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.MONSTER,
    zodInput: ZMonsterJob,
    mapper: monsterJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
