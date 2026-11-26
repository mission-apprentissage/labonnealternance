import type { IWebVitalMetric, IWebVitalsBatch } from "shared/routes/_private/web-vitals.routes"
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals/attribution"

import { publicConfig } from "@/config.public"
import { BFF_PREFIX } from "@/utils/bff-routes"
import type { IRouteHistory } from "@/utils/route-history.utils"
import { buildBatch, buildClsMetric, buildFcpMetric, buildInpMetric, buildLcpMetric, buildTtfbMetric, toRouteTemplate } from "@/utils/web-vitals.utils"

const send = (batch: IWebVitalsBatch) => {
  const url = `${BFF_PREFIX}/_private/web-vitals`
  const body = JSON.stringify(batch)
  // sendBeacon part même pendant la fermeture de l'onglet, moment où web-vitals rapporte la valeur finale
  if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return
  fetch(url, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {
    // mesure non critique : un envoi perdu n'est pas rejoué
  })
}

const newPageId = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => byte.toString(16).padStart(2, "0")).join("")

/**
 * Chargé seulement pour les visites échantillonnées (cf. WebVitalsReporter) : web-vitals pèse ~6 ko gzip.
 * Les métriques rapportées pendant que la page est visible partent ensemble au passage en arrière-plan.
 */
export function startWebVitalsReporting({ landingPath, history }: { landingPath: string; history: IRouteHistory }) {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } }
  let pageId = newPageId()
  // la dernière valeur de chaque métrique : un INP rapporté deux fois avant l'envoi ne part qu'une fois
  const pending = new Map<IWebVitalMetric["metric"], IWebVitalMetric>()

  const routeAt = (time: number | undefined) => toRouteTemplate((time === undefined ? undefined : history.pathAt(time)) ?? window.location.pathname)
  // après une restauration bfcache, les instants repartent de la restauration et ne se comparent plus à l'historique
  const loadRoute = (navigationType: string, time: number) => routeAt(navigationType === "back-forward-cache" ? undefined : time)
  const queue = (metric: IWebVitalMetric) => pending.set(metric.metric, metric)

  const flush = () => {
    if (pending.size === 0) return
    const page = {
      pageId,
      landingRoute: toRouteTemplate(landingPath),
      version: publicConfig.version,
      viewportWidth: window.innerWidth,
      cpuCores: nav.hardwareConcurrency || undefined,
      deviceMemory: nav.deviceMemory,
      effectiveType: nav.connection?.effectiveType,
    }
    send(buildBatch(page, [...pending.values()]))
    pending.clear()
  }

  onINP((metric) => queue(buildInpMetric(metric, routeAt(metric.attribution.interactionTime))))
  onCLS((metric) => queue(buildClsMetric(metric, routeAt(metric.attribution.largestShiftTime))))
  onLCP((metric) => queue(buildLcpMetric(metric, loadRoute(metric.navigationType, metric.value))))
  onFCP((metric) => queue(buildFcpMetric(metric, loadRoute(metric.navigationType, metric.value))))
  onTTFB((metric) => queue(buildTtfbMetric(metric, loadRoute(metric.navigationType, metric.value))))

  // web-vitals écoute visibilitychange en capture sur window : ses rapports finaux sont en file avant ce flush.
  // Pas de flush au pagehide : Chrome le déclenche avant visibilitychange, le lot partirait sans INP ni CLS.
  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush()
  })
  addEventListener("pageshow", (event) => {
    if (event.persisted) pageId = newPageId()
  })
}
