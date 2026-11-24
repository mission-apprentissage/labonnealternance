/** Élargissement automatique du rayon de /recherche (useAutoRadius) : paliers de 20 km jusqu'à 100. */
export const AUTO_RADIUS_STEP = 20
export const AUTO_RADIUS_MAX = 100

type IAutoRadiusSearch = { latitude?: number; longitude?: number; admin_area?: string; radius?: number }

/**
 * L'élargissement s'applique-t-il ? Un lieu (lat/lng) sans emprise administrative : avec
 * `admin_area`, le rayon n'intervient pas dans le filtre, l'élargir ne changerait rien.
 */
const isAutoRadiusActive = (search: IAutoRadiusSearch) => search.latitude !== undefined && search.longitude !== undefined && !search.admin_area

/**
 * Cette réponse déclenche-t-elle un palier ? Condition unique de l'UI (hook, skeleton, événements
 * Matomo) et du log search_queries, qui marque ces réponses jamais vues par l'usager (#5634). Si
 * l'UI et le log divergent, un skeleton infini ou des statistiques faussées.
 */
export const isAutoRadiusWidening = (search: IAutoRadiusSearch, nbHits: number | null) =>
  nbHits === 0 && isAutoRadiusActive(search) && search.radius !== undefined && search.radius < AUTO_RADIUS_MAX
