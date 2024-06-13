import { IJob } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../../../common/logger"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { runScript } from "../../../scriptWrapper"

runScript(async () => {
  logger.info("Start update delegation count job")
  const forms = await getDbCollection("recruiters")
    .find({ "jobs.delegations": { $not: { $size: 0 }, $ne: null }, jobs: { $not: { $size: 0 } } })
    .toArray()

  await asyncForEach(forms, async (form) => {
    await asyncForEach(form.jobs, async (job: IJob) => {
      if (job.delegations?.length) {
        job.job_delegation_count = job.delegations.length
      }
    })
    await getDbCollection("recruiters").updateOne({ _id: form._id }, { $set: { ...form } })
  })
  logger.info("End update delegation count job")
})
