import type { IWebVitalMetric, IWebVitalsBatch } from "shared/routes/_private/web-vitals.routes"
import type {
  CLSMetricWithAttribution,
  FCPMetricWithAttribution,
  INPMetricWithAttribution,
  LCPMetricWithAttribution,
  MetricWithAttribution,
  TTFBMetricWithAttribution,
} from "web-vitals/attribution"

const EMPLOI_TYPES = new Set(["offres_emploi_lba", "offres_emploi_partenaires", "recruteurs_lba"])
const ALTERNANCE_SECTIONS = new Set(["ville", "metier", "diplome"])
const SAFE_SEGMENT = /^[a-z0-9_-]{1,60}$/

/**
 * Gabarit de route envoyé à la place du chemin : les identifiants (offre, SIRET, utilisateur) et les intitulés
 * libres ne quittent pas le navigateur. Le type de fiche emploi est gardé, c'est le découpage des groupes de la
 * Search Console.
 */
export const toRouteTemplate = (pathname: string): string => {
  const segments = pathname.split("/").filter(Boolean)
  const [first, second] = segments
  if (!first) return "/"
  if (!SAFE_SEGMENT.test(first)) return "/*"
  if (segments.length === 1) return `/${first}`
  if (first === "emploi") return `/emploi/${EMPLOI_TYPES.has(second) ? second : "[type]"}${segments.length > 2 ? "/[id]" : ""}`
  if (first === "formation") return "/formation/[id]"
  if (first === "metiers") return "/metiers/[slug]"
  if (first === "alternance" && ALTERNANCE_SECTIONS.has(second)) return `/alternance/${second}${segments.length > 2 ? "/[slug]" : ""}`
  if (first === "espace-pro" && /^[a-z-]{1,40}$/.test(second)) return `/espace-pro/${second}${segments.length > 2 ? "/*" : ""}`
  return `/${first}/*`
}

export type IWebVitalPage = {
  pageId: string
  landingRoute: string
  version: string
  viewportWidth: number
  cpuCores?: number
  deviceMemory?: number
  effectiveType?: string
}

const MAX_LABEL = 300
// borne de l'API : une valeur au-delà ferait refuser tout le lot
const MAX_MS = 600_000

const label = (value: string | undefined | null): string | null => (value ? value.slice(0, MAX_LABEL) : null)

const ms = (value: number): number => Math.min(MAX_MS, Math.max(0, Math.round(value)))

const optionalMs = (value: number | undefined): number | null => (value === undefined ? null : ms(value))

const shift = (value: number): number => Math.round(value * 10_000) / 10_000

// la query d'une ressource peut porter un identifiant (visite, image passée par /_next/image?url=…)
const urlWithoutQuery = (url: string | undefined): string | null => {
  if (!url) return null
  if (url.startsWith("data:")) return "data:"
  return label(url.split(/[?#]/)[0])
}

// invoker vaut l'URL du script (classic/module-script) ou porte un [src="…"] (event-listener) : on n'en retire que la
// query des URL, le `#` d'un `BUTTON#id.onclick` désigne l'élément
const scriptInvoker = (invoker: string | undefined): string | null => label(invoker?.replace(/(https?:\/\/[^?#"\s\]]*)[?#][^"\s\]]*/g, "$1"))

const metricFields = ({ value, rating, navigationType }: MetricWithAttribution, route: string) => ({
  value: ms(value),
  rating,
  route,
  navigation_type: navigationType,
})

export const buildInpMetric = (metric: INPMetricWithAttribution, route: string): IWebVitalMetric => {
  const { attribution } = metric
  const { longestScript } = attribution
  return {
    metric: "INP",
    ...metricFields(metric, route),
    load_state: attribution.loadState,
    target: label(attribution.interactionTarget),
    interaction_type: attribution.interactionType ?? null,
    input_delay: ms(attribution.inputDelay),
    processing_duration: ms(attribution.processingDuration),
    presentation_delay: ms(attribution.presentationDelay),
    total_script_duration: optionalMs(attribution.totalScriptDuration),
    total_style_and_layout_duration: optionalMs(attribution.totalStyleAndLayoutDuration),
    longest_script_url: urlWithoutQuery(longestScript?.entry.sourceURL),
    longest_script_invoker: scriptInvoker(longestScript?.entry.invoker),
    longest_script_subpart: longestScript?.subpart ?? null,
    longest_script_duration: optionalMs(longestScript?.intersectingDuration),
  }
}

export const buildClsMetric = (metric: CLSMetricWithAttribution, route: string): IWebVitalMetric => ({
  metric: "CLS",
  ...metricFields(metric, route),
  value: shift(metric.value),
  load_state: metric.attribution.loadState ?? null,
  target: label(metric.attribution.largestShiftTarget),
  largest_shift_value: metric.attribution.largestShiftValue === undefined ? null : shift(metric.attribution.largestShiftValue),
})

export const buildLcpMetric = (metric: LCPMetricWithAttribution, route: string): IWebVitalMetric => {
  const { attribution } = metric
  return {
    metric: "LCP",
    ...metricFields(metric, route),
    target: label(attribution.target),
    url: urlWithoutQuery(attribution.url),
    time_to_first_byte: ms(attribution.timeToFirstByte),
    resource_load_delay: ms(attribution.resourceLoadDelay),
    resource_load_duration: ms(attribution.resourceLoadDuration),
    element_render_delay: ms(attribution.elementRenderDelay),
  }
}

export const buildTtfbMetric = (metric: TTFBMetricWithAttribution, route: string): IWebVitalMetric => {
  const { attribution } = metric
  return {
    metric: "TTFB",
    ...metricFields(metric, route),
    waiting_duration: ms(attribution.waitingDuration),
    cache_duration: ms(attribution.cacheDuration),
    dns_duration: ms(attribution.dnsDuration),
    connection_duration: ms(attribution.connectionDuration),
    request_duration: ms(attribution.requestDuration),
  }
}

export const buildFcpMetric = (metric: FCPMetricWithAttribution, route: string): IWebVitalMetric => ({
  metric: "FCP",
  ...metricFields(metric, route),
  load_state: metric.attribution.loadState,
  time_to_first_byte: ms(metric.attribution.timeToFirstByte),
  first_byte_to_fcp: ms(metric.attribution.firstByteToFCP),
})

export const buildBatch = (page: IWebVitalPage, metrics: IWebVitalMetric[]): IWebVitalsBatch => ({
  page_id: page.pageId,
  landing_route: page.landingRoute,
  version: page.version.slice(0, 50),
  viewport_width: Math.max(0, Math.round(page.viewportWidth)),
  cpu_cores: page.cpuCores ?? null,
  device_memory: page.deviceMemory ?? null,
  effective_type: page.effectiveType?.slice(0, 10) ?? null,
  metrics,
})
