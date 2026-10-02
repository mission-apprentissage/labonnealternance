"use client"

import { useEffect, useRef } from "react"

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessibilité clavier des dialogues plein écran / bottom-sheet (RGAA) :
 * - Escape ferme le dialogue (les Autocomplete MUI stoppent la propagation quand leur
 *   dropdown est ouvert → Escape ferme d'abord le dropdown, puis le dialogue) ;
 * - focus initial sur le premier élément focusable (le bouton « Fermer », en tête du DOM) ;
 * - Tab/Shift+Tab bouclent à l'intérieur du dialogue (focus trap). Focus perdu sur `<body>`
 *   (champ blurré après une sélection, cf. `blurOnSelect` de SearchBar) : Tab repart du dernier
 *   élément focus du dialogue, pas de sa tête ;
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

    // tabIndex >= 0 : exclut les boutons hors tabulation (croix et chevron des Autocomplete MUI).
    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => el.offsetParent !== null && el.tabIndex >= 0)
    focusables()[0]?.focus()

    let lastFocused: HTMLElement | null = null
    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) lastFocused = event.target
    }
    container.addEventListener("focusin", handleFocusIn)

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
      if ((!active || active === document.body) && lastFocused?.isConnected) {
        const from = lastFocused
        const target = event.shiftKey
          ? elements.filter((el) => from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING).at(-1)
          : elements.find((el) => from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
        event.preventDefault()
        const next = target ?? (event.shiftKey ? last : first)
        next.focus()
        return
      }
      // Focus sorti du dialogue (ou aux bornes) → on le ramène à l'intérieur.
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault()
        first.focus()
      }
    }

    // Posé après l'écouteur racine de React (hydratation) : les gestionnaires onKeyDown du
    // contenu passent avant le trap (cf. exitInputScreenOnTab de SearchBar).
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      container.removeEventListener("focusin", handleFocusIn)
      previouslyFocused?.focus()
    }
  }, [])

  return containerRef
}
