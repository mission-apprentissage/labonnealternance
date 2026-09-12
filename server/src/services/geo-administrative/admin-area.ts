import type { IAdminArea } from "shared/utils/admin-area"

/**
 * Filtrage de la recherche par entité administrative (région, département).
 * Contexte et mesures : issue BaseAdresseNationale/ban-plateforme#781, tools/geo-781.
 *
 * Le géocodeur Géoplateforme résout "Bretagne" en région 53 (index `poi`, code dans `citycode`)
 * mais ne renvoie pas d'emprise. Plutôt que d'approximer à la requête (rayon, bbox, contour),
 * le code est dérivé à la construction des items (`search-items-admin-codes.ts`) et indexé en
 * `token` : le filtre est un `equals`, exact et le moins coûteux possible.
 */

/** Champ `search_items` porteur du code pour la maille demandée. */
const ADMIN_AREA_FIELD: Record<IAdminArea["kind"], "departement_code" | "region_code"> = {
  region: "region_code",
  departement: "departement_code",
}

/** Clause de filtre Atlas Search : un `equals` sur le champ token de la maille. */
export function buildAdminAreaClause({ kind, code }: IAdminArea): object {
  return { equals: { path: ADMIN_AREA_FIELD[kind], value: code } }
}
