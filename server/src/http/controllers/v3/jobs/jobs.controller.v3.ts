import { badRequest } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { assertUnreachable, zRoutes } from "shared"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getS3FileLastUpdate, s3SignedUrl } from "@/common/utils/awsUtils"
import { Server } from "@/http/server"
import { EXPORT_JOBS_TO_S3_V2_FILENAME } from "@/jobs/partenaireExport/exportJobsToS3V2"
import { getUserFromRequest } from "@/security/authenticationService"
import {
  createJobOffer,
  findJobOpportunityById,
  findJobsOpportunities,
  findOfferPublishing,
  incrementDetailViewCount,
  incrementPostulerClickCount,
  incrementSearchViewCount,
  updateJobOffer,
  upsertJobOffer,
  upsertJobsPartnersMulti,
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

  server.post(
    "/v4/jobs/multi-partner",
    {
      schema: zRoutes.post["/v4/jobs/multi-partner"],
      onRequest: server.auth(zRoutes.post["/v4/jobs/multi-partner"]),
      config,
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/v4/jobs/multi-partner"]).value
      const { id, modified } = await upsertJobsPartnersMulti({ data: req.body, requestedByEmail: user.email })
      if (!modified) {
        return res.status(304).send()
      }
      return res.status(200).send({ id })
    }
  )

  server.post(
    "/v4/jobs/multi-partner/bulk",
    {
      schema: zRoutes.post["/v4/jobs/multi-partner/bulk"],
      onRequest: server.auth(zRoutes.post["/v4/jobs/multi-partner/bulk"]),
      config,
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/v4/jobs/multi-partner/bulk"]).value
      const jobs = req.body
      const results: { status: number; id?: string; error?: string }[] = []
      await asyncForEach(jobs, async (job, index) => {
        try {
          if (index > 2) throw new Error("test")
          const { id, modified } = await upsertJobsPartnersMulti({ data: job, requestedByEmail: user.email })
          const status = modified ? 200 : 304
          results.push({
            id: id.toString(),
            status,
          })
        } catch (err) {
          results.push({
            error: err + "",
            status: 500,
          })
        }
      })
      return res.status(200).send(results)
    }
  )

  server.get("/v3/jobs/:id", { schema: zRoutes.get["/v3/jobs/:id"], onRequest: server.auth(zRoutes.get["/v3/jobs/:id"]) }, async (req, res) => {
    const { id } = req.params
    const result = await findJobOpportunityById(id, new JobOpportunityRequestContext(zRoutes.get["/v3/jobs/:id"], "api-apprentissage"))
    return res.send(result)
  })

  server.get(
    "/v3/jobs/:id/publishing-informations",
    {
      schema: zRoutes.get["/v3/jobs/:id/publishing-informations"],
      onRequest: server.auth(zRoutes.get["/v3/jobs/:id/publishing-informations"]),
    },
    async (req, res) => {
      const { id } = req.params
      const result = await findOfferPublishing(id, new JobOpportunityRequestContext(zRoutes.get["/v3/jobs/:id/publishing-informations"], "api-apprentissage"))
      return res.send(result)
    }
  )

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

  server.post(
    "/v3/jobs/stats/search_view",
    {
      schema: zRoutes.post["/v3/jobs/stats/search_view"],
      config,
    },
    async (req, res) => {
      const ids = req.body
      await incrementSearchViewCount(ids)
      return res.status(200).send({})
    }
  )

  server.get(
    "/v3/jobs/export",
    {
      schema: zRoutes.get["/v3/jobs/export"],
      onRequest: server.auth(zRoutes.get["/v3/jobs/export"]),
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "1s",
        },
      },
    },
    async (req, res) => {
      const url = await s3SignedUrl("storage", EXPORT_JOBS_TO_S3_V2_FILENAME, { expiresIn: 120 })
      const lastUpdate = await getS3FileLastUpdate("storage", EXPORT_JOBS_TO_S3_V2_FILENAME)
      if (!lastUpdate) {
        throw new Error("inattendu: lastUpdate vide")
      }
      return res.send({ url, lastUpdate })
    }
  )
}
