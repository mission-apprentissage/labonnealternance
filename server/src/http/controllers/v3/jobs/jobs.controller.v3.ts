import { zRoutes } from "shared"
import { jobsRouteApiv3Converters } from "shared/routes/v3/jobs/jobs.routes.v3.model"

import { getUserFromRequest } from "@/security/authenticationService"
import { JobOpportunityRequestContext } from "@/services/jobs/jobOpportunity/JobOpportunityRequestContext"

import { createJobOffer, findJobsOpportunities, updateJobOffer } from "../../../../services/jobs/jobOpportunity/jobOpportunity.service"
import { Server } from "../../../server"

const config = {
  rateLimit: {
    max: 5,
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
      const offer = jobsRouteApiv3Converters.convertToJobsPartnersWritableApi(req.body)
      const id = await createJobOffer(user, offer)
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
      const offer = jobsRouteApiv3Converters.convertToJobsPartnersWritableApi(req.body)
      await updateJobOffer(req.params.id, user, offer)
      return res.status(204).send()
    }
  )

  server.get("/v3/jobs/search", { schema: zRoutes.get["/v3/jobs/search"], onRequest: server.auth(zRoutes.get["/v3/jobs/search"]) }, async (req, res) => {
    const result = await findJobsOpportunities(req.query, new JobOpportunityRequestContext(zRoutes.get["/v3/jobs/search"], "api-apprentissage"))
    return res.send(jobsRouteApiv3Converters.convertToJobSearchApiV3(result))
  })
}
