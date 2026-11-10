"use client"

import { usePathname } from "next/navigation"
import { Suspense, useEffect } from "react"

import { isWidget } from "@/utils/is-widget.utils"
import { createRouteHistory } from "@/utils/route-history.utils"

// Part des chargements de page mesurés. Le reste du code (web-vitals, construction et envoi des rapports) n'est
// téléchargé que pour eux : ce composant est sur le first-load de toutes les pages.
const SAMPLE_RATE = 0.1

const history = createRouteHistory()

// usePathname hors <Suspense> bloque le prérendu (cacheComponents), cf. ToastAnnouncer.
function PathRecorder() {
  const pathname = usePathname()
  useEffect(() => {
    history.record(pathname, performance.now())
  }, [pathname])
  return null
}

/** Mesure terrain INP et CLS avec attribution, sur un échantillon de visites ; lecture dans Loki (`log_web_vital`). */
export function WebVitalsReporter() {
  useEffect(() => {
    if (isWidget() || Math.random() >= SAMPLE_RATE) return
    const landingPath = window.location.pathname
    let cancelled = false
    import("@/utils/web-vitals-reporting")
      .then(({ startWebVitalsReporting }) => {
        if (!cancelled) startWebVitalsReporting({ landingPath, history })
      })
      .catch(() => {
        // chunk introuvable (version déployée entre-temps) : la visite n'est simplement pas mesurée
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Suspense fallback={null}>
      <PathRecorder />
    </Suspense>
  )
}
