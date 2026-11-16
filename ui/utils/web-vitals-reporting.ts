import type { IWebVitalReport } from "shared/routes/_private/web-vitals.routes"
import { onCLS, onINP } from "web-vitals/attribution"

import { publicConfig } from "@/config.public"
import type { IRouteHistory } from "@/utils/route-history.utils"
import { buildClsReport, buildInpReport, type IWebVitalContext, toRouteTemplate } from "@/utils/web-vitals.utils"

const send = (report: IWebVitalReport) => {
  const url = `${publicConfig.apiEndpoint}/_private/web-vitals`
  const body = JSON.stringify(report)
  // sendBeacon part même pendant la fermeture de l'onglet, moment où web-vitals rapporte la valeur finale
  if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return
  fetch(url, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {
    // mesure non critique : un envoi perdu n'est pas rejoué
  })
}

/** Chargé seulement pour les visites échantillonnées (cf. WebVitalsReporter) : web-vitals pèse ~6 ko gzip. */
export function startWebVitalsReporting({ landingPath, history }: { landingPath: string; history: IRouteHistory }) {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } }
  const contextAt = (time: number | undefined): IWebVitalContext => {
    const path = (time === undefined ? undefined : history.pathAt(time)) ?? window.location.pathname
    return {
      landingRoute: toRouteTemplate(landingPath),
      route: toRouteTemplate(path),
      version: publicConfig.version,
      viewportWidth: window.innerWidth,
      cpuCores: nav.hardwareConcurrency || undefined,
      deviceMemory: nav.deviceMemory,
      effectiveType: nav.connection?.effectiveType,
    }
  }
  onINP((metric) => send(buildInpReport(metric, contextAt(metric.attribution.interactionTime))))
  onCLS((metric) => send(buildClsReport(metric, contextAt(metric.attribution.largestShiftTime))))
}
