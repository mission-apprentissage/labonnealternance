"use client"

import { useEffect, useState } from "react"

/**
 * Détecte si la page est affichée dans une iframe (mode widget embarqué chez un partenaire).
 *
 * Initialisé à `false` (contenu de navigation affiché par défaut) : ces pages sont
 * majoritairement consultées en accès direct / SEO, on évite ainsi tout layout shift.
 * La détection réelle se fait côté client après montage (obligatoire pour éviter un
 * hydration mismatch, `window` n'existant pas côté serveur).
 */
export function useIsWidget() {
  const [isWidget, setIsWidget] = useState(false)

  useEffect(() => {
    setIsWidget(window.self !== window.top)
  }, [])

  return isWidget
}
