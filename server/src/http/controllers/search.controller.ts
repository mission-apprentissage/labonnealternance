import { zRoutes } from "shared"

import type { Server } from "@/http/server"
import { searchItems, suggestSearchTerms } from "@/services/search/search.service"
import { logSearchQuery } from "@/services/search/search-query-log.service"

export default (server: Server) => {
  server.get(
    "/v1/search",
    {
      schema: zRoutes.get["/v1/search"],
      config: { rateLimit: { max: 30, timeWindow: "1s" } },
    },
    async (req, res) => {
      // Log des recherches au fil de l'eau : fire-and-forget (jamais d'await — zéro impact
      // sur la latence), page 0 uniquement (l'infinite scroll rejoue le même q à chaque page).
      // `internal` exclut les requêtes non issues d'un utilisateur (ex. prefetch SSR pour le SEO
      // de /recherche), qui rejouent sinon le même q que le fetch client et faussent les stats.
      // Loggé aussi côté échec (cf. #5153 : avant, une requête qui plantait n'était jamais
      // loguée, seul Sentry en gardait la trace) — re-throw ensuite, comportement d'erreur
      // inchangé pour le client et pour la capture Sentry standard.
      const shouldLog = !req.query.internal && req.query.q?.trim() && req.query.page === 0
      try {
        const result = await searchItems(req.query)
        if (shouldLog) {
          void logSearchQuery(req.query, { status: result.degraded ? "degraded" : "ok", nbHits: result.nbHits })
        }
        return res.status(200).send(result)
      } catch (err) {
        if (shouldLog) {
          void logSearchQuery(req.query, { status: "error", nbHits: null })
        }
        throw err
      }
    }
  )

  server.get(
    "/v1/search/suggest",
    {
      schema: zRoutes.get["/v1/search/suggest"],
      config: { rateLimit: { max: 60, timeWindow: "1s" } },
    },
    async (req, res) => {
      const result = await suggestSearchTerms(req.query)
      return res.status(200).send(result)
    }
  )
}
