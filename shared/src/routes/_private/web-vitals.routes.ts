import { z } from "../../helpers/zod-with-open-api.js"
import type { IRoutesDef } from "../common.routes.js"

const zRating = z.enum(["good", "needs-improvement", "poor"])
const zLoadState = z.enum(["loading", "dom-interactive", "dom-content-loaded", "complete"])
const zMs = z.number().nonnegative().max(600_000)
const zShift = z.number().nonnegative().max(1000)
// Gabarit produit par toRouteTemplate (UI) : au-delà du premier segment, que des mots sans chiffre ou des
// jokers, pour qu'aucun identifiant (ObjectId, SIRET) n'entre dans les logs même si le client se trompe.
export const zWebVitalRoute = z
  .string()
  .max(200)
  .regex(/^\/(\*|[a-z0-9_-]{1,60}(\/([a-z_-]{1,40}|\[(id|slug|type)\]|\*)){0,2})?$/)
const zLabel = z.string().max(300)
// la query d'une ressource peut porter un identifiant (/_next/image?url=…, pixel de suivi)
const zUrlWithoutQuery = zLabel.regex(/^[^?#]*$/)

// Champs communs aux métriques : route au moment de la mesure, de quoi segmenter sans identifier le visiteur.
const zWebVitalMetricContext = {
  value: zMs,
  rating: zRating,
  route: zWebVitalRoute,
  navigation_type: z.string().max(30),
}

export const ZWebVitalINP = z.strictObject({
  metric: z.literal("INP"),
  ...zWebVitalMetricContext,
  load_state: zLoadState.nullish(),
  target: zLabel.nullish(),
  interaction_type: z.enum(["pointer", "keyboard"]).nullish(),
  input_delay: zMs,
  processing_duration: zMs,
  presentation_delay: zMs,
  total_script_duration: zMs.nullish(),
  total_style_and_layout_duration: zMs.nullish(),
  longest_script_url: zUrlWithoutQuery.nullish(),
  longest_script_invoker: zLabel.nullish(),
  longest_script_subpart: z.enum(["input-delay", "processing-duration", "presentation-delay"]).nullish(),
  longest_script_duration: zMs.nullish(),
})

export const ZWebVitalCLS = z.strictObject({
  metric: z.literal("CLS"),
  ...zWebVitalMetricContext,
  value: zShift,
  load_state: zLoadState.nullish(),
  target: zLabel.nullish(),
  largest_shift_value: zShift.nullish(),
})

export const ZWebVitalLCP = z.strictObject({
  metric: z.literal("LCP"),
  ...zWebVitalMetricContext,
  target: zLabel.nullish(),
  url: zUrlWithoutQuery.nullish(),
  time_to_first_byte: zMs,
  resource_load_delay: zMs,
  resource_load_duration: zMs,
  element_render_delay: zMs,
})

export const ZWebVitalTTFB = z.strictObject({
  metric: z.literal("TTFB"),
  ...zWebVitalMetricContext,
  waiting_duration: zMs,
  cache_duration: zMs,
  dns_duration: zMs,
  connection_duration: zMs,
  request_duration: zMs,
})

export const ZWebVitalFCP = z.strictObject({
  metric: z.literal("FCP"),
  ...zWebVitalMetricContext,
  load_state: zLoadState.nullish(),
  time_to_first_byte: zMs,
  first_byte_to_fcp: zMs,
})

export const ZWebVitalMetric = z.discriminatedUnion("metric", [ZWebVitalINP, ZWebVitalCLS, ZWebVitalLCP, ZWebVitalTTFB, ZWebVitalFCP])

export const ZWebVitalsBatch = z.strictObject({
  // tiré au hasard à chaque chargement (et restauration bfcache) : regroupe les envois d'une même page pour ne
  // garder que la dernière valeur, sans lien d'une page à l'autre
  page_id: z.string().regex(/^[0-9a-f]{16}$/),
  // route au chargement de la page : celle de CrUX / Search Console
  landing_route: zWebVitalRoute,
  version: z.string().max(50),
  viewport_width: z.number().int().nonnegative().max(20_000),
  cpu_cores: z.number().int().nonnegative().max(1024).nullish(),
  device_memory: z.number().nonnegative().max(1024).nullish(),
  effective_type: z.string().max(10).nullish(),
  // au plus une entrée par métrique et par passage en arrière-plan (cf. startWebVitalsReporting)
  metrics: z.array(ZWebVitalMetric).min(1).max(5),
})

export type IWebVitalMetric = z.output<typeof ZWebVitalMetric>
export type IWebVitalsBatch = z.output<typeof ZWebVitalsBatch>

export const zPrivateWebVitalsRoutes = {
  post: {
    // public : mesures terrain envoyées par sendBeacon depuis un échantillon de visites (cf. WebVitalsReporter)
    "/_private/web-vitals": {
      method: "post",
      path: "/_private/web-vitals",
      body: ZWebVitalsBatch,
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
