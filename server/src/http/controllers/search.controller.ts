import { badRequest } from "@hapi/boom"
import { zRoutes } from "shared"
import { isPrivateIp } from "@/common/utils/private-network"

import type { Server } from "@/http/server"
import { searchItems, suggestSearchTerms } from "@/services/search/search.service"
import { logSearchQuery } from "@/services/search/search-query-log.service"

// Plafonds hors réseau interne (anti-aspiration) : le front pagine par 20 et ne dépasse
// 400 résultats que sur 0,6 % de ses appels. hitsPerPage est ramené à 20 plutôt que refusé,
// car l'UI le reprend tel quel de l'URL ; nbPages plafonné masque le bouton « Voir plus de
// résultats ». Sans Sec-Fetch-Site: same-origin (scripts, mais aussi le rendu de Googlebot
// sur les pages /recherche indexables, qui ne demande que la page 0), seule la page 0 est servie.
const PUBLIC_MAX_HITS_PER_PAGE = 20
const PUBLIC_MAX_PAGES = 20
const NON_BROWSER_MAX_PAGES = 1

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
      // Honoré seulement depuis notre réseau (le SSR passe par la passerelle docker) : un client
      // externe ne peut pas sortir ses requêtes des stats.
      // Loggé aussi en cas d'échec (#5153), puis re-throw : comportement d'erreur inchangé pour
      // le client et pour la capture Sentry.
      const fromPrivateNetwork = isPrivateIp(req.ip)
      const maxPages = req.headers["sec-fetch-site"] === "same-origin" ? PUBLIC_MAX_PAGES : NON_BROWSER_MAX_PAGES
      if (!fromPrivateNetwork && req.query.page >= maxPages) {
        throw badRequest(
          maxPages === PUBLIC_MAX_PAGES
            ? `page limitée à ${PUBLIC_MAX_PAGES - 1} : affinez la recherche`
            : "pagination réservée au site ; pour un usage programmatique, utilisez l'API Apprentissage (api.apprentissage.beta.gouv.fr)"
        )
      }
      const query = fromPrivateNetwork ? req.query : { ...req.query, hitsPerPage: Math.min(req.query.hitsPerPage, PUBLIC_MAX_HITS_PER_PAGE) }

      const isInternal = req.query.internal === true && fromPrivateNetwork
      const shouldLog = !isInternal && req.query.q?.trim() && req.query.page === 0
      try {
        const { degraded, ...searchResult } = await searchItems(query)
        const result = fromPrivateNetwork ? searchResult : { ...searchResult, nbPages: Math.min(searchResult.nbPages, maxPages) }
        if (shouldLog) {
          void logSearchQuery(req.query, { status: degraded ? "degraded" : "ok", nbHits: result.nbHits })
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
