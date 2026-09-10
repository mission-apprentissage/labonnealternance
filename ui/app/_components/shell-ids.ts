/**
 * Identifiants du « shell » (en-tête, pied de page) propres à chaque layout.
 *
 * Next conserve la route précédemment affichée montée dans un `<Activity mode="hidden">` — cache
 * de navigation avant/arrière activé par `cacheComponents`, jusqu'à trois entrées. Quand une
 * navigation change de layout, le shell quitté reste donc dans le document, masqué par
 * `display: none !important`. Deux layouts qui portent les mêmes id produisent alors des doublons,
 * et le JS du DSFR associe une modale à ses boutons via le sélecteur global
 * `[aria-controls="<id>"]` (`Disclosure.init`) : le bouton du menu burger visible se retrouve câblé
 * sur la modale de la copie masquée et n'ouvre plus rien. Les ancres des liens d'évitement
 * pointeraient de la même façon vers la copie masquée.
 *
 * Chaque layout déclare donc son propre shell et en dérive ses identifiants.
 */
export type ShellName =
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

export const headerId = (shell: ShellName) => `header-links-${shell}`

export const mainId = (shell: ShellName) => `main-content-${shell}`

export const footerId = (shell: ShellName) => `footer-links-${shell}`
