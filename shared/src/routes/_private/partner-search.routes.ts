import { extensions } from "../../helpers/zod-helpers/zod-primitives.js"
import { z } from "../../helpers/zod-with-open-api.js"
import type { IRoutesDef } from "../common.routes.js"

export const PARTNER_SEARCH_LINK_PARTNERS = ["monmaster"] as const
export type IPartnerSearchLinkPartner = (typeof PARTNER_SEARCH_LINK_PARTNERS)[number]

export const PARTNER_SEARCH_CODE_MAX_LENGTH = 12

export const zPrivatePartnerSearchRoutes = {
  get: {
    // Réservée au rendu serveur de l'UI (`/monmaster/<RNCP>`) : 404 hors réseau privé, cf. partner-search.private.controller.
    "/_private/search/partner-link": {
      method: "get",
      path: "/_private/search/partner-link",
      querystring: z.strictObject({
        partner: z.enum(PARTNER_SEARCH_LINK_PARTNERS),
        code: z.string().max(PARTNER_SEARCH_CODE_MAX_LENGTH),
        latitude: extensions.latitude({ coerce: true }).optional(),
        longitude: extensions.longitude({ coerce: true }).optional(),
      }),
      response: {
        "200": z.object({
          q: z.string().nullable(),
          lieu_label: z.string().nullable(),
        }),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
