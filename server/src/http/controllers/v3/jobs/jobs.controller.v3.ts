import { zRoutes } from "shared"

import { getUserFromRequest } from "@/security/authenticationService"
import { JobOpportunityRequestContext } from "@/services/jobs/jobOpportunity/JobOpportunityRequestContext"

import {
  createJobOffer,
  findJobOpportunityById,
  findJobsOpportunities,
  findOfferPublishing,
  updateJobOffer,
  upsertJobOffer,
} from "../../../../services/jobs/jobOpportunity/jobOpportunity.service"
import { Server } from "../../../server"

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
    const { id } = req.params
    const result = await findJobOpportunityById(id, new JobOpportunityRequestContext(zRoutes.get["/v3/jobs/:id"], "api-apprentissage"))
    return res.send(result)
  })

  server.get("/v3/jobs/:id/publishing", { schema: zRoutes.get["/v3/jobs/:id/publishing"], onRequest: server.auth(zRoutes.get["/v3/jobs/:id/publishing"]) }, async (req, res) => {
    const { id } = req.params
    const result = await findOfferPublishing(id, new JobOpportunityRequestContext(zRoutes.get["/v3/jobs/:id/publishing"], "api-apprentissage"))
    return res.send(result)
  })
}
