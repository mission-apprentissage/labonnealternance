import { z } from "../../helpers/zod-with-open-api.js"
import type { IRoutesDef } from "../common.routes.js"

const zRating = z.enum(["good", "needs-improvement", "poor"])
const zLoadState = z.enum(["loading", "dom-interactive", "dom-content-loaded", "complete"])
const zMs = z.number().nonnegative().max(600_000)
const zRoute = z.string().max(200)
const zLabel = z.string().max(300)

// Champs communs aux métriques : de quoi segmenter (page, version, appareil) sans identifier le visiteur.
const zWebVitalContext = {
  rating: zRating,
  // route au chargement de la page (celle de CrUX / Search Console) et route au moment de l'événement mesuré
  landing_route: zRoute,
  route: zRoute,
  version: z.string().max(50),
  navigation_type: z.string().max(30),
  load_state: zLoadState.nullish(),
  target: zLabel.nullish(),
  viewport_width: z.number().int().nonnegative().max(20_000),
  cpu_cores: z.number().int().nonnegative().max(1024).nullish(),
  device_memory: z.number().nonnegative().max(1024).nullish(),
  effective_type: z.string().max(10).nullish(),
}

export const ZWebVitalINP = z.strictObject({
  metric: z.literal("INP"),
  value: zMs,
  ...zWebVitalContext,
  interaction_type: z.enum(["pointer", "keyboard"]).nullish(),
  input_delay: zMs,
  processing_duration: zMs,
  presentation_delay: zMs,
  total_script_duration: zMs.nullish(),
  total_style_and_layout_duration: zMs.nullish(),
  longest_script_url: zLabel.nullish(),
  longest_script_invoker: zLabel.nullish(),
  longest_script_subpart: z.enum(["input-delay", "processing-duration", "presentation-delay"]).nullish(),
  longest_script_duration: zMs.nullish(),
})

export const ZWebVitalCLS = z.strictObject({
  metric: z.literal("CLS"),
  value: z.number().nonnegative().max(1000),
  ...zWebVitalContext,
  largest_shift_value: z.number().nonnegative().max(1000).nullish(),
})

export const ZWebVitalReport = z.discriminatedUnion("metric", [ZWebVitalINP, ZWebVitalCLS])

export type IWebVitalReport = z.output<typeof ZWebVitalReport>

export const zPrivateWebVitalsRoutes = {
  post: {
    // public : mesure terrain INP / CLS envoyée par sendBeacon depuis un échantillon de visites (cf. WebVitalsReporter)
    "/_private/web-vitals": {
      method: "post",
      path: "/_private/web-vitals",
      body: ZWebVitalReport,
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
