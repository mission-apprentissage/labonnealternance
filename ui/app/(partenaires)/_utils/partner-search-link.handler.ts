import { captureException } from "@sentry/nextjs"
import type { IPartnerSearchLinkPartner } from "shared/routes/_private/partner-search.routes"
import { PARTNER_SEARCH_CODE_MAX_LENGTH } from "shared/routes/_private/partner-search.routes"

import { apiGet } from "@/utils/api.utils"

import type { IPartnerSearchResolution } from "./partner-search-link.utils"
import { buildPartnerSearchUrl, PARTNER_REDIRECT_HEADERS, readPartnerGeo } from "./partner-search-link.utils"

export const RESOLUTION_TIMEOUT_MS = 3000

/** 307 vers `/recherche`. Une panne de résolution replie sur la recherche géo seule, jamais sur une erreur. */
export async function handlePartnerSearchRedirect(partner: IPartnerSearchLinkPartner, code: string, search: URLSearchParams): Promise<Response> {
  const geo = readPartnerGeo(search)
  let resolution: IPartnerSearchResolution | null = null
  try {
    resolution = await apiGet(
      "/_private/search/partner-link",
      // Code trop long envoyé vide plutôt que tronqué : la troncature pourrait fabriquer un code valide.
      { querystring: { partner, code: code.length <= PARTNER_SEARCH_CODE_MAX_LENGTH ? code : "", ...geo } },
      // `timeout` et non `signal` : apiGet construit son propre signal et ignore celui fourni.
      { timeout: RESOLUTION_TIMEOUT_MS }
    )
  } catch (error) {
    captureException(error, { tags: { partner_search_link: partner } })
  }

  // Location relative : l'origine vue par Next derrière nginx est l'adresse interne du conteneur.
  return new Response(null, { status: 307, headers: { Location: buildPartnerSearchUrl(partner, search, resolution), ...PARTNER_REDIRECT_HEADERS } })
}
