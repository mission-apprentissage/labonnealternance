import { Readable } from "stream"
import { createGunzip } from "zlib"

import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawJobteaserModel from "shared/models/rawJobteaser.model"

import { importFromStreamInXml } from "@/jobs/offrePartenaire/importFromStreamInXml"
import { jobteaserJobToJobsPartners, ZJobteaserJob } from "@/jobs/offrePartenaire/jobteaser/jobteaserMapper"

import config from "../../../config"
import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

const rawCollectionName = rawJobteaserModel.collectionName
const offerXmlTag = "job"

type ListType = { last_modified: string; mode: number; name: string; size: number }
export const importJobteaserRaw = async (sourceStream?: NodeJS.ReadableStream) => {
  if (sourceStream) {
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: sourceStream,
      partnerLabel: JOBPARTNERS_LABEL.JOBTEASER,
      conflictingOpeningTagWithoutAttributes: true,
    })
  } else {
    // fetch token
    const tokenResponse = await fetch("https://partneraccess.jobteaser.com/api/v2/user/token", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${config.jobteaserUserName}:${config.jobteaserPassword}`)}`,
      },
    })
    const token = ((await tokenResponse.json()) as { access_token: string; expires_at: string }).access_token

    // fetch list of files
    const listResponse = await fetch("https://partneraccess.jobteaser.com/api/v2/user/dirs", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    const list: ListType[] = (await listResponse.json()) as ListType[]
    const latestFile = list.at(-1)?.name

    // fetch latest file
    const fileResponse = await fetch(`https://partneraccess.jobteaser.com/api/v2/user/files?path=${latestFile}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const nodeStream = Readable.fromWeb(fileResponse.body!)
    const gunzip = createGunzip()
    const fileSourceStream = nodeStream.pipe(gunzip)
    await importFromStreamInXml({
      destinationCollection: rawCollectionName,
      offerXmlTag,
      stream: fileSourceStream,
      partnerLabel: JOBPARTNERS_LABEL.JOBTEASER,
      conflictingOpeningTagWithoutAttributes: true,
    })
  }
}

export const importJobteaserToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.JOBTEASER,
    zodInput: ZJobteaserJob,
    mapper: jobteaserJobToJobsPartners,
    documentJobRoot: offerXmlTag,
  })
}
