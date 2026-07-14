import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { searchAlgolia, suggestAlgolia } from "@/services/search/search.service"
import { logSearchQuery } from "@/services/search/searchQueryLog.service"

export default (server: Server) => {
  server.get(
    "/v1/search",
    {
      schema: zRoutes.get["/v1/search"],
      config: { rateLimit: { max: 30, timeWindow: "1s" } },
    },
    async (req, res) => {
      const result = await searchAlgolia(req.query)
      // Log des recherches au fil de l'eau : fire-and-forget (jamais d'await — zéro impact
      // sur la latence), page 0 uniquement (l'infinite scroll rejoue le même q à chaque page).
      if (req.query.q?.trim() && req.query.page === 0) {
        void logSearchQuery(req.query, result.nbHits)
      }
      return res.status(200).send(result)
    }
  )

  server.get(
    "/v1/search/suggest",
    {
      schema: zRoutes.get["/v1/search/suggest"],
      config: { rateLimit: { max: 60, timeWindow: "1s" } },
    },
    async (req, res) => {
      const result = await suggestAlgolia(req.query)
      return res.status(200).send(result)
    }
  )
}
