import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"
import { ZSeoJobCard } from "./seoMetier.model.js"

const collectionName = "seo_diplomes" as const

const ZSeoDiplomeKpis = z.object({
  duration: z.string(),
  entreprise: z.string(),
  salaire: z.string(),
})

const ZSeoDiplomeProgrammeSections = z.object({
  enseignements_generaux: z.array(z.string()),
  enseignements_professionnels: z.array(z.string()),
  competences_developpees: z.array(z.string()),
})

const ZSeoDiplomeSalaireLigne = z.object({
  age: z.string(),
  premiereAnnee: z.string(),
  deuxiemeAnnee: z.string(),
})

const ZSeoDiplomeMetier = z.object({
  icon: z.string(),
  title: z.string(),
  offres: z.string(),
  href: z.string(),
})

const ZSeoDiplomeEcoleCard = z.object({
  formationTitle: z.string(),
  etablissement: z.string(),
  lieu: z.string(),
  href: z.string(),
})

export const ZSeoDiplome = z
  .object({
    _id: zObjectId,
    slug: z.string(),
    titre: z.string(),
    intituleLongFormation: z.string(),
    sousTitre: z.string(),
    kpis: ZSeoDiplomeKpis,
    description: z.object({
      text: z.string(),
      objectifs: z.array(z.string()),
    }),
    programme: z.object({
      text: z.string(),
      sections: ZSeoDiplomeProgrammeSections,
    }),
    ecoles: z.array(ZSeoDiplomeEcoleCard),
    salaire: z.array(ZSeoDiplomeSalaireLigne),
    metiers: z.object({
      text: z.string(),
      liste: z.array(ZSeoDiplomeMetier),
    }),
    cards: z.array(ZSeoJobCard),
    created_at: z.date(),
    updated_at: z.date(),
  })
  .strict()

export type ISeoDiplome = z.output<typeof ZSeoDiplome>

export type IDiplomeKpis = z.output<typeof ZSeoDiplomeKpis>
export type IDiplomeProgrammeSections = z.output<typeof ZSeoDiplomeProgrammeSections>
export type IDiplomeSalaireLigne = z.output<typeof ZSeoDiplomeSalaireLigne>
export type IDiplomeMetier = z.output<typeof ZSeoDiplomeMetier>
export type IDiplomeEcoleCard = z.output<typeof ZSeoDiplomeEcoleCard>

export type IDiplomeSeoData = z.output<typeof ZSeoDiplome>

export default {
  zod: ZSeoDiplome,
  indexes: [[{ slug: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
