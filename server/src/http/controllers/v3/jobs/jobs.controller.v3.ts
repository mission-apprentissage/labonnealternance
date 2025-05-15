import { badRequest } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { assertUnreachable, zRoutes } from "shared"

import { Server } from "@/http/server"
import { getUserFromRequest } from "@/security/authenticationService"
import {
  createJobOffer,
  findJobOpportunityById,
  findJobsOpportunities,
  incrementDetailViewCount,
  incrementPostulerClickCount,
  incrementSearchViewCount,
  updateJobOffer,
  upsertJobOffer,
} from "@/services/jobs/jobOpportunity/jobOpportunity.service"
import { JobOpportunityRequestContext } from "@/services/jobs/jobOpportunity/JobOpportunityRequestContext"

const config = {
  rateLimit: {
    max: 1,
    timeWindow: "1s",
  },
}

export const jobsApiV3Routes = (server: Server) => {
  server.post(
    "/v3/jobs",
    {
      schema: zRoutes.post["/v3/jobs"],
      onRequest: server.auth(zRoutes.post["/v3/jobs"]),
      config,
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/v3/jobs"]).value
      const id = await createJobOffer(user, req.body)
      return res.status(200).send({ id })
    }
  )

  server.put(
    "/v3/jobs/:id",
    {
      schema: zRoutes.put["/v3/jobs/:id"],
      onRequest: server.auth(zRoutes.put["/v3/jobs/:id"]),
      config,
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.put["/v3/jobs/:id"]).value
      await updateJobOffer(req.params.id, user, req.body)
      return res.status(204).send()
    }
  )

  server.get("/v3/jobs/search", { schema: zRoutes.get["/v3/jobs/search"], onRequest: server.auth(zRoutes.get["/v3/jobs/search"]) }, async (req, res) => {
    const result = await findJobsOpportunities(req.query, new JobOpportunityRequestContext(zRoutes.get["/v3/jobs/search"], "api-apprentissage"))
    await incrementSearchViewCount(
      result.jobs.flatMap((job) => {
        const id = job.identifier.id
        return id && ObjectId.isValid(id) ? [new ObjectId(id)] : []
      })
    )
    return res.send(result)
  })

  server.post(
    "/v3/jobs/multi-partner",
    {
      schema: zRoutes.post["/v3/jobs/multi-partner"],
      onRequest: server.auth(zRoutes.post["/v3/jobs/multi-partner"]),
      config,
    },
    async (req, res) => {
      const { partner_label, partner_job_id } = req.body
      const user = getUserFromRequest(req, zRoutes.post["/v3/jobs/multi-partner"]).value
      const id = await upsertJobOffer(req.body, partner_label, partner_job_id, user.email)
      return res.status(200).send({ id })
    }
  )

  server.get("/v3/jobs/:id", { schema: zRoutes.get["/v3/jobs/:id"], onRequest: server.auth(zRoutes.get["/v3/jobs/:id"]) }, async (req, res) => {
    const result = await findJobOpportunityById(req.params.id, new JobOpportunityRequestContext(zRoutes.get["/v3/jobs/:id"], "api-apprentissage"))
    return res.send(result)
  })

  server.post(
    "/v3/jobs/:id/stats/:eventType",
    {
      schema: zRoutes.post["/v3/jobs/:id/stats/:eventType"],
      config,
    },
    async (req, res) => {
      const { eventType, id } = req.params
      if (!ObjectId.isValid(id)) {
        throw badRequest("id is not valid")
      }
      const objectId = new ObjectId(id)

      switch (eventType) {
        case "detail_view": {
          await incrementDetailViewCount(objectId)
          break
        }
        case "postuler_click": {
          await incrementPostulerClickCount(objectId)
          break
        }
        default: {
          assertUnreachable(eventType)
        }
      }
      return res.status(200).send({})
    }
  )
}
