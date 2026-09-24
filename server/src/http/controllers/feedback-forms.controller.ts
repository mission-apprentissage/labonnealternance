import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { listActiveFeedbackForms } from "@/services/feedback-form.service"
import { recordFeedbackDisplay, startFeedbackResponse, updateFeedbackResponse } from "@/services/feedback-response.service"

const rateLimitConfig = { rateLimit: { max: 10, timeWindow: "1s" } } as const

export default (server: Server) => {
  server.get(
    "/feedback-forms/active",
    {
      schema: zRoutes.get["/feedback-forms/active"],
      config: rateLimitConfig,
    },
    async (_req, res) => {
      const forms = await listActiveFeedbackForms()
      // une activation met au plus une minute à atteindre les navigateurs
      return res.status(200).header("Cache-Control", "public, max-age=60").send({ forms })
    }
  )

  server.post(
    "/feedback-forms/:slug/displays",
    {
      schema: zRoutes.post["/feedback-forms/:slug/displays"],
      config: rateLimitConfig,
    },
    async (req, res) => {
      const display_id = await recordFeedbackDisplay(req.params.slug, req.body)
      return res.status(200).send({ display_id })
    }
  )

  server.post(
    "/feedback-forms/:slug/responses",
    {
      schema: zRoutes.post["/feedback-forms/:slug/responses"],
      config: rateLimitConfig,
    },
    async (req, res) => {
      const created = await startFeedbackResponse(req.params.slug, req.body.display_id)
      return res.status(200).send(created)
    }
  )

  server.put(
    "/feedback-responses/:id",
    {
      schema: zRoutes.put["/feedback-responses/:id"],
      config: rateLimitConfig,
    },
    async (req, res) => {
      const result = await updateFeedbackResponse(req.params.id, req.body)
      return res.status(200).send(result)
    }
  )
}
