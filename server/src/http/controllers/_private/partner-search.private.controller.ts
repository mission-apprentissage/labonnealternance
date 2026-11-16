import { notFound } from "@hapi/boom"
import { zRoutes } from "shared/index"

import { isPrivateIp } from "@/common/utils/private-network"
import type { Server } from "@/http/server"
import { resolvePartnerSearchLink } from "@/services/search/partner-search-link.service"

export function partnerSearchRouteController(server: Server) {
  server.get(
    "/_private/search/partner-link",
    {
      schema: zRoutes.get["/_private/search/partner-link"],
      // Seul le rendu serveur de l'UI l'appelle (réseau docker). En onRequest, avant la validation
      // du schéma : un appelant externe reçoit 404 quels que soient ses paramètres, sans 400 qui
      // révélerait la route. Doublé côté nginx (10_api.conf.template).
      onRequest: async (req) => {
        if (!isPrivateIp(req.ip)) throw notFound()
      },
    },
    async (req, res) => {
      return res.status(200).send(await resolvePartnerSearchLink(req.query))
    }
  )
}
