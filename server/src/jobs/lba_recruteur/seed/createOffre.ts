// @ts-nocheck
import { omit } from "lodash-es"
import { logger } from "../../../common/logger.js"
import { Recruiter, Job } from "../../../common/model/index.js"

export const createOffreCollection = async () => {
  logger.info("Deleting offres collections...")
  await Job.deleteMany({})

  logger.info("Creating offres collections...")
  let recruiters = await Recruiter.find({}).lean()

  await Promise.all(
    recruiters.map(async (form) => {
      await Promise.all(
        form.jobs.map(async (job) => {
          const filtOffre = omit(job, ["_id"])
          const filtForm = omit(form, ["_id", "jobs", "status"])
          filtForm.recruiterStatus = form.status
          filtOffre.jobId = job._id

          await Job.collection.insertOne({ ...filtOffre, ...filtForm })
        })
      )
    })
  )

  let jobs = await Job.countDocuments()

  return { jobs }
}
