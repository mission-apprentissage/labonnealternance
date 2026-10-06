import { z } from "../helpers/zod-with-open-api.js"
import { FEEDBACK_URL_PARAM_MAX_LENGTH, FEEDBACK_URL_PARAMS_MAX_KEYS } from "../utils/feedback-url-params.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const zUrlParamValue = z.string().max(FEEDBACK_URL_PARAM_MAX_LENGTH)

/**
 * Où le bouton « Donner mon avis » est apparu : le motif de déclenchement qui a matché, les valeurs
 * de ses segments `:param` et les paramètres de l'URL, filtrés (cf. `sanitizeFeedbackUrlParams`).
 * Jamais l'URL brute.
 */
export const ZFeedbackPageContext = z.strictObject({
  page: z.string().min(1).max(FEEDBACK_URL_PARAM_MAX_LENGTH),
  path_params: z.record(zUrlParamValue, zUrlParamValue).refine((params) => Object.keys(params).length <= FEEDBACK_URL_PARAMS_MAX_KEYS),
  query: z.record(zUrlParamValue, z.union([zUrlParamValue, z.array(zUrlParamValue).max(10)])).refine((params) => Object.keys(params).length <= FEEDBACK_URL_PARAMS_MAX_KEYS),
})
export type IFeedbackPageContext = z.output<typeof ZFeedbackPageContext>

/** Une apparition du bouton, pour les analyses fines dans Metabase. Les totaux du back-office lisent `feedback_display_counts`. */
export const ZFeedbackDisplay = ZFeedbackPageContext.extend({
  _id: zObjectId,
  form_slug: z.string(),
  created_at: z.coerce.date<Date>(),
})
export type IFeedbackDisplay = z.output<typeof ZFeedbackDisplay>

export default {
  zod: ZFeedbackDisplay,
  indexes: [[{ form_slug: 1, created_at: -1 }, {}]],
  collectionName: "feedback_displays" as const,
} as const satisfies IModelDescriptor
