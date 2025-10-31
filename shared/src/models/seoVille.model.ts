import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "seo_villes" as const

const ZSeoVilleDescription = z.object({
  title: z.string(),
  text: z.string(),
  image: z.string(),
})

const ZSeoVilleVie = z.object({
  text: z.string(),
  activites: z.array(
    z.object({
      naf_label: z.string(),
      rome_codes: z.array(z.string()),
    })
  ),
})

const ZSeoVilleMobilite = z.object({
  text: z.string(),
  transports: z.array(
    z.object({
      label: z.string(),
      type: z.string(),
    })
  ),
})

const ZSeoVilleLogement = z.object({
  text: z.string(),
  loyers: z.array(
    z.object({
      type: z.string(),
      price_range: z.string(),
    })
  ),
})

const ZSeoVilleLoisirs = z.object({
  text: z.string(),
  types: z.array(
    z.object({
      label: z.string(),
      type: z.string(),
    })
  ),
})

const ZSeoVilleContent = z.object({
  description_ville: ZSeoVilleDescription,
  vie: ZSeoVilleVie,
  mobilite: ZSeoVilleMobilite,
  logement: ZSeoVilleLogement,
  loisirs: ZSeoVilleLoisirs,
})

export const ZSeoVille = z
  .object({
    _id: zObjectId,
    ville: z.string(),
    cp: z.string().min(5).max(5),
    slug: z.string(),
    geopoint: z.object({ lat: z.number(), long: z.number() }),
    job_count: z.number(),
    recruteur_count: z.number(),
    content: ZSeoVilleContent,
    created_at: z.date(),
    updated_at: z.date(),
  })
  .strict()

export type ISeoVille = z.output<typeof ZSeoVille>

export default {
  zod: ZSeoVille,
  indexes: [[{ slug: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
