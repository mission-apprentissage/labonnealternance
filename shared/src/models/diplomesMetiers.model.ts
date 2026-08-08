import type { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

export const ZRomeWithLabel = z.strictObject({
  codeRome: z.string(),
  intitule: z.string(),
})

export type IRomeWithLabel = z.output<typeof ZRomeWithLabel>

export const ZMetierEnrichi = z.strictObject({
  label: z.string(),
  romes: z.string().array(),
  rncps: z.string().array().nullish().optional(),
  type: z.string().nullish().optional(),
  romeTitles: ZRomeWithLabel.array().nullish().optional(),
})

export type IMetierEnrichi = z.output<typeof ZMetierEnrichi>
export type IMetierEnrichiJson = Jsonify<IMetierEnrichi>

export const ZMetierEnrichiArray = z.array(ZMetierEnrichi)

export const ZMetiers = z.strictObject({
  metiers: z
    .string()

    .array(),
})

export type IMetiers = z.output<typeof ZMetiers>

export const ZMetiersEnrichis = z.strictObject({
  labelsAndRomes: ZMetierEnrichiArray.optional(),
  labelsAndRomesForDiplomas: ZMetierEnrichiArray.optional(),
})

export type IMetiersEnrichis = z.output<typeof ZMetiersEnrichis>

export const ZAppellationRome = z.strictObject({
  code_rome: z.string().optional(),
  intitule: z.string(),
  appellation: z.string(),
})
export type IAppellationRome = z.output<typeof ZAppellationRome>

export const ZAppellationsRomes = z.strictObject({
  coupleAppellationRomeMetier: ZAppellationRome.array(),
})
export type IAppellationsRomes = z.output<typeof ZAppellationsRomes>

const collectionName = "diplomesmetiers" as const

export const ZDiplomesMetiers = z.strictObject({
  _id: zObjectId,
  intitule_long: z.string(),
  codes_romes: z.array(z.string()),
  codes_rncps: z.array(z.string()),
  acronymes_intitule: z.string(),
  created_at: z.date(),
  last_update_at: z.date(),
})

export type IDiplomesMetiers = z.output<typeof ZDiplomesMetiers>

export default {
  zod: ZDiplomesMetiers,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
