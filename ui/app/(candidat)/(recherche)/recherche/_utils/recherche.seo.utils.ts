import type { IGetRoutes, IQuery } from "shared"

import type { IRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

/**
 * Construit le querystring de `/v1/_private/jobs/min` à partir des params de recherche.
 * Source unique partagée entre le hook client (`use-recherche-results`) et le rendu SEO serveur
 * (`RechercheSeoContent`), pour garantir que les offres affichées correspondent à la même recherche.
 */
export function buildJobsMinQuerystring(rechercheParams: IRecherchePageParams | null): IQuery<IGetRoutes["/v1/_private/jobs/min"]> {
  if (!rechercheParams) return {}

  const query: IQuery<IGetRoutes["/v1/_private/jobs/min"]> = {
    romes: rechercheParams.romes.join(","),
  }

  if (rechercheParams.geo) {
    query.longitude = rechercheParams.geo.longitude
    query.latitude = rechercheParams.geo.latitude
    query.radius = rechercheParams.radius
  }

  if (rechercheParams.diploma) {
    query.diploma = rechercheParams.diploma
  }

  if (rechercheParams.opco) {
    query.opco = rechercheParams.opco
  }

  if (rechercheParams.rncp) {
    query.rncp = rechercheParams.rncp
  }

  if (rechercheParams.elligibleHandicapFilter) {
    query.elligibleHandicapFilter = "true"
  }

  return query
}
