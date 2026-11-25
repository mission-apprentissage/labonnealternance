import { zRoutes } from "shared/index"

import { logger } from "@/common/logger"
import { isBotUserAgent } from "@/common/utils/bot-user-agent"
import type { Server } from "@/http/server"

// Une page n'envoie qu'un lot par passage en arrière-plan : au-delà, ce n'est pas un navigateur.
const rateLimitConfig = { rateLimit: { max: 5, timeWindow: "1s" } } as const

export function webVitalsRouteController(server: Server) {
  server.post(
    "/_private/web-vitals",
    {
      schema: zRoutes.post["/_private/web-vitals"],
      config: rateLimitConfig,
      attachValidation: true,
    },
    async (req, res) => {
      const isBot = isBotUserAgent(req.headers["user-agent"])
      if (req.validationError) {
        if (!isBot) {
          // chemins et règles seulement : les valeurs refusées peuvent être celles qu'on refuse de journaliser.
          // Borné : la taille du tableau d'erreurs dépend du corps envoyé.
          const fields = (req.validationError.validation ?? []).slice(0, 20).map(({ instancePath, keyword }) => `${instancePath || "/"} ${keyword}`)
          logger.warn({ web_vital_rejected: fields }, "web-vital rejected")
        }
        throw req.validationError
      }
      if (!isBot) {
        const { metrics, ...page } = req.body
        for (const metric of metrics) {
          // lu dans Loki sous log_web_vital (le collecteur préfixe chaque champ pino par log_), aucun stockage en base
          logger.info({ web_vital: { ...metric, ...page } }, "web-vital")
        }
      }
      return res.status(200).send({})
    }
  )
}
