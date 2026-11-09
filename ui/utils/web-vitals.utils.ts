import type { IWebVitalReport } from "shared/routes/_private/web-vitals.routes"
import type { CLSMetricWithAttribution, INPMetricWithAttribution } from "web-vitals/attribution"

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

export type IWebVitalContext = {
  landingRoute: string
  route: string
  version: string
  viewportWidth: number
  cpuCores?: number
  deviceMemory?: number
  effectiveType?: string
}

const MAX_LABEL = 300

const label = (value: string | undefined | null): string | null => (value ? value.slice(0, MAX_LABEL) : null)

const ms = (value: number): number => Math.max(0, Math.round(value))

const optionalMs = (value: number | undefined): number | null => (value === undefined ? null : ms(value))

// la query d'un script tiers peut porter un identifiant de visite
const scriptUrl = (url: string | undefined): string | null => (url ? label(url.split(/[?#]/)[0]) : null)

const commonFields = (context: IWebVitalContext) => ({
  landing_route: context.landingRoute,
  route: context.route,
  version: context.version.slice(0, 50),
  viewport_width: Math.max(0, Math.round(context.viewportWidth)),
  cpu_cores: context.cpuCores ?? null,
  device_memory: context.deviceMemory ?? null,
  effective_type: context.effectiveType?.slice(0, 10) ?? null,
})

export const buildInpReport = ({ value, rating, navigationType, attribution }: INPMetricWithAttribution, context: IWebVitalContext): IWebVitalReport => {
  const { longestScript } = attribution
  return {
    metric: "INP",
    value: ms(value),
    rating,
    navigation_type: navigationType,
    load_state: attribution.loadState,
    target: label(attribution.interactionTarget),
    ...commonFields(context),
    interaction_type: attribution.interactionType ?? null,
    input_delay: ms(attribution.inputDelay),
    processing_duration: ms(attribution.processingDuration),
    presentation_delay: ms(attribution.presentationDelay),
    total_script_duration: optionalMs(attribution.totalScriptDuration),
    total_style_and_layout_duration: optionalMs(attribution.totalStyleAndLayoutDuration),
    longest_script_url: scriptUrl(longestScript?.entry.sourceURL),
    longest_script_invoker: label(longestScript?.entry.invoker),
    longest_script_subpart: longestScript?.subpart ?? null,
    longest_script_duration: optionalMs(longestScript?.intersectingDuration),
  }
}

export const buildClsReport = ({ value, rating, navigationType, attribution }: CLSMetricWithAttribution, context: IWebVitalContext): IWebVitalReport => ({
  metric: "CLS",
  value: Math.round(value * 10_000) / 10_000,
  rating,
  navigation_type: navigationType,
  load_state: attribution.loadState ?? null,
  target: label(attribution.largestShiftTarget),
  ...commonFields(context),
  largest_shift_value: attribution.largestShiftValue === undefined ? null : Math.round(attribution.largestShiftValue * 10_000) / 10_000,
})
