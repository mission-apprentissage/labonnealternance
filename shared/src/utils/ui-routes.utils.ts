import { UI_ROUTE_PATTERNS } from "../constants/ui-routes.js"

const toSegments = (routePattern: string): string[] => routePattern.split("/").filter(Boolean)

/**
 * Un segment saisi correspond-il au segment d'une route réelle ?
 * - `:param` ne matche qu'un segment dynamique : viser `/guide/:x` alors que le site n'expose
 *   que des chemins littéraux serait une erreur de saisie, pas un joker (c'est `*` qui joue ce rôle).
 * - sinon, égalité stricte.
 */
const segmentMatches = (inputSegment: string, routeSegment: string): boolean =>
  inputSegment.startsWith(":") ? routeSegment.startsWith(":") || routeSegment === "*" : inputSegment === routeSegment

/**
 * Le chemin de déclenchement saisi dans le back-office correspond-il à au moins une page du site ?
 *
 * Grammaire acceptée, identique à celle que le widget applique à `usePathname()` :
 * - segment littéral : `/recherche`
 * - `:param` : un segment dynamique, quel que soit son nom (`/formation/:id/:titre`)
 * - `*` en dernier segment : toute la sous-arborescence (`/guide-alternant/*`)
 */
export function matchesKnownUiRoute(inputPattern: string): boolean {
  const trimmed = inputPattern.trim()
  if (!trimmed.startsWith("/")) {
    return false
  }

  const inputSegments = toSegments(trimmed)
  const isPrefix = inputSegments.at(-1) === "*"
  const comparedSegments = isPrefix ? inputSegments.slice(0, -1) : inputSegments
  if (comparedSegments.includes("*")) {
    // `*` n'a de sens qu'en dernière position
    return false
  }

  return UI_ROUTE_PATTERNS.some((routePattern) => {
    const routeSegments = toSegments(routePattern)
    if (isPrefix ? routeSegments.length < comparedSegments.length : routeSegments.length !== comparedSegments.length) {
      return false
    }
    return comparedSegments.every((segment, index) => segmentMatches(segment, routeSegments[index]))
  })
}
