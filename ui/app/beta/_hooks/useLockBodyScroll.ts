import { useEffect } from "react"

/**
 * Bloque le scroll de la page derrière une modale plein écran, restauré au démontage.
 * `overflow: hidden` posé sur <html> ET <body> : iOS Safari ignore historiquement le
 * body seul.
 */
export function useLockBodyScroll() {
  useEffect(() => {
    const previousBody = document.body.style.overflow
    const previousHtml = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousBody
      document.documentElement.style.overflow = previousHtml
    }
  }, [])
}
