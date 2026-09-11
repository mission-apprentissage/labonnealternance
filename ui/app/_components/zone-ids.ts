/**
 * Identifiants propres à chaque zone de l'application — en-tête, landmark de contenu, pied de page.
 * Une zone est l'ossature qui entoure une page : la plupart du temps celle d'un layout, parfois
 * celle d'une page qui rend la sienne (détail d'offre, détail de formation, page d'erreur). À ne
 * pas confondre avec le « shell » de Next, qui désigne la partie statique préchauffée d'une route.
 *
 * Next conserve la route précédemment affichée montée dans un `<Activity mode="hidden">` — cache
 * de navigation avant/arrière activé par `cacheComponents`, jusqu'à trois entrées. Quand une
 * navigation change de layout, l'ossature quittée reste donc dans le document, masquée par
 * `display: none !important`. Deux zones qui portent les mêmes id produisent alors des doublons,
 * et le JS du DSFR associe une modale à ses boutons via le sélecteur global
 * `[aria-controls="<id>"]` (`Disclosure.init`) : le bouton du menu burger visible se retrouve câblé
 * sur la modale de la copie masquée et n'ouvre plus rien. Les ancres des liens d'évitement
 * pointeraient de la même façon vers la copie masquée.
 *
 * Chaque zone déclare donc son nom et en dérive ses identifiants.
 */
export type ZoneName =
  | "1jeune1solution"
  | "detail-emploi"
  | "detail-formation"
  | "detail-rendez-vous"
  | "editorial"
  | "editorial-notion"
  | "error"
  | "espace-pro-authentification"
  | "espace-pro-connecte"
  | "espace-pro-creation"
  | "espace-pro-from-mail"
  | "formulaire-intention"
  | "home"
  | "landing"
  | "not-found"
  | "postuler"
  | "rdva"
  | "recherche"
  | "test-widget"
  | "widget"

/**
 * Ancres susceptibles d'être ciblées par un lien d'évitement. L'union est fermée pour qu'une
 * faute de frappe dans un `SkipLinks` échoue au typecheck plutôt qu'à l'exécution, où elle
 * produirait un lien d'évitement muet.
 */
type AnchorName = "footer-links" | "header-links" | "main-content" | "search-content-container" | "search-content-container-mobile" | "search-form" | "search-form-mobile"

/**
 * Suffixe une ancre par sa zone. À utiliser pour toute cible de lien d'évitement, y compris
 * celles rendues par les pages : deux pages d'un même layout coexistent elles aussi dans le
 * document après une navigation, l'ancienne masquée par le cache de navigation.
 */
export const zoneScopedId = (zone: ZoneName, anchor: AnchorName) => `${anchor}-${zone}`

export const headerId = (zone: ZoneName) => zoneScopedId(zone, "header-links")

export const mainId = (zone: ZoneName) => zoneScopedId(zone, "main-content")

export const footerId = (zone: ZoneName) => zoneScopedId(zone, "footer-links")
