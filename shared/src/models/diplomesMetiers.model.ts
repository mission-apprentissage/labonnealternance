import type { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

export const ZRomeWithLabel = z
  .object({
    codeRome: z.string(),
    intitule: z.string(),
  })
  .strict()

export type IRomeWithLabel = z.output<typeof ZRomeWithLabel>

export const ZMetierEnrichi = z
  .object({
    label: z.string(),
    romes: z.string().array(),
    rncps: z.string().array().nullish().optional(),
    type: z.string().nullish().optional(),
    romeTitles: ZRomeWithLabel.array().nullish().optional(),
  })
  .strict()

export type IMetierEnrichi = z.output<typeof ZMetierEnrichi>
export type IMetierEnrichiJson = Jsonify<IMetierEnrichi>

export const ZMetierEnrichiArray = z.array(ZMetierEnrichi)

export const ZMetiers = z
  .object({
    metiers: z
      .string()

      .array(),
  })
  .strict()

export type IMetiers = z.output<typeof ZMetiers>

export const ZMetiersEnrichis = z
  .object({
    labelsAndRomes: ZMetierEnrichiArray.optional(),
    labelsAndRomesForDiplomas: ZMetierEnrichiArray.optional(),
  })
  .strict()

export type IMetiersEnrichis = z.output<typeof ZMetiersEnrichis>

export const ZAppellationRome = z
  .object({
    code_rome: z.string().optional(),
    intitule: z.string(),
    appellation: z.string(),
  })
  .strict()
export type IAppellationRome = z.output<typeof ZAppellationRome>

export const ZAppellationsRomes = z
  .object({
    coupleAppellationRomeMetier: ZAppellationRome.array(),
  })
  .strict()
export type IAppellationsRomes = z.output<typeof ZAppellationsRomes>

const collectionName = "diplomesmetiers" as const

export const ZDiplomesMetiers = z
  .object({
    _id: zObjectId,
    intitule_long: z.string(),
    codes_romes: z.array(z.string()),
    codes_rncps: z.array(z.string()),
    acronymes_intitule: z.string(),
    created_at: z.date(),
    last_update_at: z.date(),
  })
  .strict()

export type IDiplomesMetiers = z.output<typeof ZDiplomesMetiers>

export default {
  zod: ZDiplomesMetiers,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
