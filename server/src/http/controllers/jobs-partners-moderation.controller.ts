import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { getUserFromRequest } from "@/security/authentication.service"
import {
  getModerationHistory,
  getModerationJobDetail,
  getModerationScope,
  getModerationSummaries,
  listModerationQueue,
  reclassifyFailedModerations,
  reclassifyModeration,
  refuseModeration,
  validateModeration,
} from "@/services/jobs-partners-moderation-review.service"

/** Back-office de modération des offres libres (#5499), pour les administrateurs et les OPCO dans leur périmètre. */
export default (server: Server) => {
  server.get(
    "/moderation/jobs",
    {
      schema: zRoutes.get["/moderation/jobs"],
      onRequest: server.auth(zRoutes.get["/moderation/jobs"]),
    },
    async (req, res) => {
      const { limit = 50, offset = 0, ...filters } = req.query
      const { jobs, total } = await listModerationQueue({ scope: getModerationScope(req.userAccess), limit, offset, ...filters })
      return res.status(200).send({ jobs, pagination: { total, limit, offset } })
    }
  )

  server.get(
    "/moderation/jobs/summary",
    {
      schema: zRoutes.get["/moderation/jobs/summary"],
      onRequest: server.auth(zRoutes.get["/moderation/jobs/summary"]),
    },
    async (req, res) => {
      const jobs = await getModerationSummaries({ scope: getModerationScope(req.userAccess), ids: req.query.ids })
      return res.status(200).send({ jobs })
    }
  )

  server.get(
    "/moderation/jobs/:id",
    {
      schema: zRoutes.get["/moderation/jobs/:id"],
      onRequest: server.auth(zRoutes.get["/moderation/jobs/:id"]),
    },
    async (req, res) => {
      return res.status(200).send(await getModerationJobDetail({ scope: getModerationScope(req.userAccess), id: req.params.id }))
    }
  )

  server.get(
    "/moderation/jobs/:id/history",
    {
      schema: zRoutes.get["/moderation/jobs/:id/history"],
      onRequest: server.auth(zRoutes.get["/moderation/jobs/:id/history"]),
    },
    async (req, res) => {
      const moderations = await getModerationHistory({ scope: getModerationScope(req.userAccess), id: req.params.id })
      return res.status(200).send({ moderations })
    }
  )

  server.post(
    "/moderation/jobs/:id/validate",
    {
      schema: zRoutes.post["/moderation/jobs/:id/validate"],
      onRequest: server.auth(zRoutes.post["/moderation/jobs/:id/validate"]),
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/moderation/jobs/:id/validate"]).value
      const result = await validateModeration({ scope: getModerationScope(req.userAccess), id: req.params.id, moderationId: req.body.moderation_id, user })
      return res.status(200).send(result)
    }
  )

  server.post(
    "/moderation/jobs/:id/refuse",
    {
      schema: zRoutes.post["/moderation/jobs/:id/refuse"],
      onRequest: server.auth(zRoutes.post["/moderation/jobs/:id/refuse"]),
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/moderation/jobs/:id/refuse"]).value
      const { moderation_id, agent_note, comment } = req.body
      const result = await refuseModeration({
        scope: getModerationScope(req.userAccess),
        id: req.params.id,
        moderationId: moderation_id,
        user,
        agentNote: agent_note,
        comment,
      })
      return res.status(200).send(result)
    }
  )

  server.post(
    "/moderation/jobs/:id/reclassify",
    {
      schema: zRoutes.post["/moderation/jobs/:id/reclassify"],
      onRequest: server.auth(zRoutes.post["/moderation/jobs/:id/reclassify"]),
    },
    async (req, res) => {
      const user = getUserFromRequest(req, zRoutes.post["/moderation/jobs/:id/reclassify"]).value
      return res.status(200).send(await reclassifyModeration({ scope: getModerationScope(req.userAccess), id: req.params.id, user }))
    }
  )

  server.post(
    "/moderation/jobs/reclassify",
    {
      schema: zRoutes.post["/moderation/jobs/reclassify"],
      onRequest: server.auth(zRoutes.post["/moderation/jobs/reclassify"]),
    },
    async (_req, res) => {
      return res.status(200).send(await reclassifyFailedModerations())
    }
  )
}
