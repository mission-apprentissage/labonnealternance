"use client"

import { useEffect, useState } from "react"

/**
 * Détecte si la page est affichée dans une iframe (mode widget embarqué chez un partenaire).
 * Source de vérité unique de la détection widget, réutilisée partout (pages détail, layout recherche).
 *
 * @param initialValue valeur avant montage :
 *   - `false` (défaut) pour les pages en accès direct / SEO → contenu affiché par défaut, évite le layout shift.
 *   - `true` en contexte majoritairement embarqué (widget recherche) → évite d'afficher brièvement la nav.
 *
 * La détection réelle se fait côté client après montage (obligatoire pour éviter un
 * hydration mismatch, `window` n'existant pas côté serveur).
 */
export function useIsWidget(initialValue = false) {
  const [isWidget, setIsWidget] = useState(initialValue)

  useEffect(() => {
    setIsWidget(window.self !== window.top)
  }, [])

  return isWidget
}
