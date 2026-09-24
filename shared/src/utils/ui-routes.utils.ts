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

type IScopePattern = { segments: string[]; isPrefix: boolean }

const parseScopePattern = (pattern: string): IScopePattern => {
  const segments = toSegments(pattern.trim())
  const isPrefix = segments.at(-1) === "*"
  return { segments: isPrefix ? segments.slice(0, -1) : segments, isPrefix }
}

const isParam = (segment: string) => segment.startsWith(":")

/**
 * La page courante (`usePathname()`) fait-elle partie d'une page de déclenchement ? Même grammaire
 * que `matchesKnownUiRoute` : `:param` vaut n'importe quel segment, `*` final couvre la
 * sous-arborescence, page de départ comprise (`/guide/*` couvre `/guide`).
 */
export function matchesScope(pattern: string, pathname: string): boolean {
  const { segments, isPrefix } = parseScopePattern(pattern)
  const pathSegments = toSegments(pathname)
  if (isPrefix ? pathSegments.length < segments.length : pathSegments.length !== segments.length) {
    return false
  }
  return segments.every((segment, index) => isParam(segment) || segment === pathSegments[index])
}

/**
 * Deux pages de déclenchement peuvent-elles viser une même page ? `/formation/*` et
 * `/formation/:id/:titre` se chevauchent, `/recherche` et `/formation/*` non. Sert à garantir
 * qu'un seul formulaire est actif par page.
 */
export function scopePatternsOverlap(a: string, b: string): boolean {
  const left = parseScopePattern(a)
  const right = parseScopePattern(b)
  const compatible = (length: number) =>
    Array.from({ length }, (_, index) => index).every((index) => isParam(left.segments[index]) || isParam(right.segments[index]) || left.segments[index] === right.segments[index])

  if (left.isPrefix && right.isPrefix) return compatible(Math.min(left.segments.length, right.segments.length))
  if (left.isPrefix) return right.segments.length >= left.segments.length && compatible(left.segments.length)
  if (right.isPrefix) return left.segments.length >= right.segments.length && compatible(right.segments.length)
  return left.segments.length === right.segments.length && compatible(left.segments.length)
}

/**
 * Valeurs des segments `:param` du motif pour la page courante : `/formation/:id/:titre` sur
 * `/formation/123/cap` donne `{ id: "123", titre: "cap" }`. Avec un `*` final, le reste du chemin
 * va sous la clé `*`. `null` si le motif ne couvre pas la page.
 */
/** Clés que `extractScopeParams` peut produire pour ce motif : ses segments `:param`, plus `*` s'il couvre une sous-arborescence. */
export function getScopeParamNames(pattern: string): string[] {
  const { segments, isPrefix } = parseScopePattern(pattern)
  return [...segments.filter(isParam).map((segment) => segment.slice(1)), ...(isPrefix ? ["*"] : [])]
}

const safeDecode = (segment: string) => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

export function extractScopeParams(pattern: string, pathname: string): Record<string, string> | null {
  if (!matchesScope(pattern, pathname)) return null
  const { segments, isPrefix } = parseScopePattern(pattern)
  const pathSegments = toSegments(pathname)
  const params: Record<string, string> = {}
  segments.forEach((segment, index) => {
    if (isParam(segment)) params[segment.slice(1)] = safeDecode(pathSegments[index])
  })
  if (isPrefix && pathSegments.length > segments.length) {
    params["*"] = pathSegments.slice(segments.length).map(safeDecode).join("/")
  }
  return params
}
