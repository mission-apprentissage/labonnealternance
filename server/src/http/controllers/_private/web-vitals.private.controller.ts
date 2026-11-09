import { zRoutes } from "shared/index"

import { logger } from "@/common/logger"
import { isBotUserAgent } from "@/common/utils/bot-user-agent"
import type { Server } from "@/http/server"

// Une page n'envoie qu'un rapport par métrique et par passage en arrière-plan : au-delà, ce n'est pas un navigateur.
const rateLimitConfig = { rateLimit: { max: 5, timeWindow: "1s" } } as const

export function webVitalsRouteController(server: Server) {
  server.post(
    "/_private/web-vitals",
    {
      schema: zRoutes.post["/_private/web-vitals"],
      config: rateLimitConfig,
    },
    async (req, res) => {
      if (!isBotUserAgent(req.headers["user-agent"])) {
        // lu dans Loki sous log_web_vital (le collecteur préfixe chaque champ pino par log_), aucun stockage en base
        logger.info({ web_vital: req.body }, "web-vital")
      }
      return res.status(200).send({})
    }
  )
}
