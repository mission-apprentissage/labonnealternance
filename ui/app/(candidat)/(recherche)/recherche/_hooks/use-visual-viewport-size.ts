import { useEffect, useState } from "react"

interface VisualViewportSize {
  /** Hauteur visible en px CSS — null tant que non mesurée (SSR, navigateur sans visualViewport). */
  height: number | null
  offsetTop: number
}

/**
 * Suit la taille du viewport VISUEL : sur mobile, le clavier virtuel réduit le visualViewport
 * sans toucher au layout viewport — un panneau `position: fixed; inset: 0` garde donc sa
 * hauteur pleine page et son bas (liste de suggestions, footer) passe sous le clavier.
 * `offsetTop` : iOS fait défiler le viewport visuel (pas le document) pour amener le champ
 * focus en vue — le panneau doit suivre ce décalage. Écoute resize ET scroll : l'ouverture
 * du clavier s'anime après le focus et ne déclenche parfois que l'un des deux.
 */
export function useVisualViewportSize(): VisualViewportSize {
  const [size, setSize] = useState<VisualViewportSize>({ height: null, offsetTop: 0 })

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setSize({ height: Math.round(vv.height), offsetTop: Math.round(vv.offsetTop) })
    update()
    vv.addEventListener("resize", update, { passive: true })
    vv.addEventListener("scroll", update, { passive: true })
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])

  return size
}
