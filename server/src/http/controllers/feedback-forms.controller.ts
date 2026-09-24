import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { listActiveFeedbackForms } from "@/services/feedback-form.service"

export default (server: Server) => {
  server.get(
    "/feedback-forms/active",
    {
      schema: zRoutes.get["/feedback-forms/active"],
      config: { rateLimit: { max: 10, timeWindow: "1s" } },
    },
    async (_req, res) => {
      const forms = await listActiveFeedbackForms()
      // une activation met au plus une minute à atteindre les navigateurs
      return res.status(200).header("Cache-Control", "public, max-age=60").send({ forms })
    }
  )
}
