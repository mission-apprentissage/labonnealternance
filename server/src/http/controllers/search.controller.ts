import { badRequest } from "@hapi/boom"
import { zRoutes } from "shared"
import { isPrivateIp } from "@/common/utils/private-network"

import type { Server } from "@/http/server"
import { searchItems, suggestSearchTerms } from "@/services/search/search.service"
import { logSearchPageBeyondLast, logSearchQuery } from "@/services/search/search-query-log.service"
import { getSearchChannel, requireSearchToken } from "@/services/search/search-token.service"

// Plafonds hors réseau interne (anti-aspiration) : le front pagine par 20 et ne dépasse
// 400 résultats que sur 0,6 % de ses appels. hitsPerPage est ramené à 20 plutôt que refusé,
// car l'UI le reprend tel quel de l'URL ; nbPages plafonné masque le bouton « Voir plus de
// résultats ». Le BFF de l'UI transmet l'IP de l'internaute : ses appels y sont soumis.
const PUBLIC_MAX_HITS_PER_PAGE = 20
const PUBLIC_MAX_PAGES = 20

export default (server: Server) => {
  server.get(
    "/v1/search",
    {
      schema: zRoutes.get["/v1/search"],
      config: { rateLimit: { max: 30, timeWindow: "1s" } },
    },
    async (req, res) => {
      await requireSearchToken(req, { count: true })
      // Log des recherches au fil de l'eau : fire-and-forget (jamais d'await — zéro impact
      // sur la latence), page 0 uniquement (l'infinite scroll rejoue le même q à chaque page).
      // `internal` exclut les requêtes non issues d'un utilisateur (ex. prefetch SSR pour le SEO
      // de /recherche), qui rejouent sinon le même q que le fetch client et faussent les stats.
      // Honoré seulement depuis notre réseau (le SSR appelle l'API en direct) : un appel relayé
      // par le BFF porte l'IP de l'internaute et ne peut pas sortir ses requêtes des stats.
      // Loggé aussi en cas d'échec (#5153), puis re-throw : comportement d'erreur inchangé pour
      // le client et pour la capture Sentry.
      const fromPrivateNetwork = isPrivateIp(req.ip)
      const channel = getSearchChannel(req) ?? "api"
      if (!fromPrivateNetwork && req.query.page >= PUBLIC_MAX_PAGES) {
        throw badRequest(`page limitée à ${PUBLIC_MAX_PAGES - 1} : affinez la recherche`)
      }
      const query = fromPrivateNetwork ? req.query : { ...req.query, hitsPerPage: Math.min(req.query.hitsPerPage, PUBLIC_MAX_HITS_PER_PAGE) }

      const isInternal = req.query.internal === true && fromPrivateNetwork
      const shouldLog = !isInternal && req.query.q?.trim() && req.query.page === 0
      try {
        const { degraded, ...searchResult } = await searchItems(query)
        if (searchResult.hits.length === 0 && searchResult.nbHits > 0) {
          logSearchPageBeyondLast({ channel, page: req.query.page, nbHits: searchResult.nbHits })
        }
        const result = fromPrivateNetwork ? searchResult : { ...searchResult, nbPages: Math.min(searchResult.nbPages, PUBLIC_MAX_PAGES) }
        if (shouldLog) {
          void logSearchQuery(req.query, { status: degraded ? "degraded" : "ok", nbHits: result.nbHits }, channel)
        }
        return res.status(200).send(result)
      } catch (err) {
        if (shouldLog) {
          void logSearchQuery(req.query, { status: "error", nbHits: null }, channel)
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
      await requireSearchToken(req, { count: false })
      const result = await suggestSearchTerms(req.query)
      return res.status(200).send(result)
    }
  )
}
