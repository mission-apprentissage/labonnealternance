import type { Metadata } from "next"

/**
 * Directive robots par défaut du site, pilotée via l'API metadata de Next.
 * `disableRobots` est vrai sur les environnements hors production (recette, preview, pentest, local)
 * et absent en production → `index, follow`.
 */
export function getRobotsMetadata(disableRobots: boolean | undefined): Metadata["robots"] {
  return disableRobots ? { index: false, follow: false } : { index: true, follow: true }
}
