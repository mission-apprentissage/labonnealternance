import { badRequest } from "@hapi/boom"
import { JOB_STATUS_ENGLISH, zRoutes } from "shared"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import type { Server } from "@/http/server"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.post(
    "/v2/_private/jobs/provided/:id",
    {
      schema: zRoutes.post["/v2/_private/jobs/provided/:id"],
      onRequest: server.auth(zRoutes.post["/v2/_private/jobs/provided/:id"]),
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const job = await getDbCollection("jobs_partners").findOne({ _id: id })
      if (!job) {
        throw badRequest("Job does not exist")
      }

      if (job.offer_status === JOB_STATUS_ENGLISH.POURVUE) {
        throw badRequest("Job is already provided")
      }
      await getDbCollection("jobs_partners").findOneAndUpdate({ _id: id }, { $set: { offer_status: JOB_STATUS_ENGLISH.POURVUE } })
      return res.status(200).send({})
    }
  )

  server.post(
    "/v2/_private/jobs/canceled/:id",
    {
      schema: zRoutes.post["/v2/_private/jobs/canceled/:id"],
      onRequest: server.auth(zRoutes.post["/v2/_private/jobs/canceled/:id"]),
      config,
    },
    async (req, res) => {
      const { id } = req.params
      const job = await getDbCollection("jobs_partners").findOne({ _id: id })
      if (!job) {
        throw badRequest("Job does not exists")
      }

      if (job.offer_status === JOB_STATUS_ENGLISH.ANNULEE) {
        throw badRequest("Job is already canceled")
      }
      await getDbCollection("jobs_partners").findOneAndUpdate(
        { _id: id },
        {
          $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE },
          $push: {
            offer_status_history: {
              date: new Date(),
              status: JOB_STATUS_ENGLISH.ANNULEE,
              reason: "annulation manuelle par api",
              granted_by: "jobs.controller.v2",
            },
          },
        }
      )
      return res.status(200).send({})
    }
  )
}
