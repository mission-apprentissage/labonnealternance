import type { Virtualizer } from "@tanstack/react-virtual"

type ScrollToVirtualItemOptions = {
  /** Virtualizer contenant l'item. */
  virtualizer: Virtualizer<any, Element>
  /** Index de l'item virtualisé vers lequel scroller. */
  index: number
  /** Espace réservé en haut du viewport (ex: hauteur du header sticky). */
  offsetTop: number
  /** `"auto"` instantané, `"smooth"` animé. */
  behavior: ScrollBehavior
  maxAttempts?: number
  onComplete?: () => void
}

/**
 * Scrolle vers un item virtualisé en l'alignant sous un éventuel header sticky.
 *
 * 1. Scroll approximatif à la position estimée (`measurementsCache[index]`) pour
 *    amener la zone cible dans le viewport et forcer son rendu.
 * 2. Boucle de correction en `requestAnimationFrame` : dès que l'item est dans
 *    le DOM, lecture de sa vraie position via `getBoundingClientRect()` et
 *    ajustement. Contourne l'erreur accumulée par `estimateSize` sur les items
 *    jamais rendus au-dessus.
 *
 */
export function scrollToVirtualItem({ virtualizer, index, offsetTop, behavior, maxAttempts = 20, onComplete }: ScrollToVirtualItemOptions): () => void {
  const scrollTo = (top: number) => {
    window.scrollTo({ top: Math.max(0, top), behavior })
  }

  const scrollFromMeasurement = () => {
    virtualizer.getVirtualItems()
    const measurement = virtualizer.measurementsCache[index]
    if (measurement) scrollTo(measurement.start - offsetTop)
  }

  scrollFromMeasurement()

  let cancelled = false
  let attempts = 0
  const refine = () => {
    if (cancelled) return
    const element = document.querySelector<HTMLElement>(`[data-index="${index}"]`)
    if (element) {
      const absoluteTop = element.getBoundingClientRect().top + window.scrollY
      const target = Math.max(0, absoluteTop - offsetTop)
      if (Math.abs(window.scrollY - target) > 1) {
        scrollTo(target)
      }
    } else {
      scrollFromMeasurement()
    }
    if (attempts++ < maxAttempts) {
      requestAnimationFrame(refine)
    } else {
      onComplete?.()
    }
  }
  requestAnimationFrame(refine)

  return () => {
    cancelled = true
  }
}
