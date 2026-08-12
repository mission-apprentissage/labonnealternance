"use client"

import { useEffect, useRef } from "react"

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessibilité clavier des dialogues plein écran / bottom-sheet (RGAA) :
 * - Escape ferme le dialogue (les Autocomplete MUI stoppent la propagation quand leur
 *   dropdown est ouvert → Escape ferme d'abord le dropdown, puis le dialogue) ;
 * - focus initial sur le premier élément focusable (le bouton « Fermer », en tête du DOM) ;
 * - Tab/Shift+Tab bouclent à l'intérieur du dialogue (focus trap) ;
 * - à la fermeture (démontage), le focus revient à l'élément déclencheur.
 *
 * Poser la ref retournée sur l'élément `role="dialog"`.
 */
export function useDialogA11y(onClose: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => el.offsetParent !== null)
    focusables()[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current()
        return
      }
      if (event.key !== "Tab") return
      const elements = focusables()
      if (!elements.length) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      const active = document.activeElement
      // Focus sorti du dialogue (ou aux bornes) → on le ramène à l'intérieur.
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [])

  return containerRef
}
