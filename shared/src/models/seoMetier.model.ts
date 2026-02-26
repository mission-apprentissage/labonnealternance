import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"
import { ZJobsPartnersOfferPrivate } from "./jobsPartners.model.js"

const collectionName = "seo_metiers" as const

const ZSeoMetierMission = z.object({
  title: z.string(),
  description: z.string(),
})

const ZSeoMetierCompetence = z.object({
  title: z.string(),
  description: z.string(),
})

const ZSeoMetierSalaire = z.object({
  salaire_brut_moyen: z.number(),
  salaire_1ere_annee: z.number(),
  salaire_2eme_annee: z.number(),
  salaire_median: z.number(),
})

const ZSeoMetierEntreprise = z.object({
  nom: z.string(),
  job_count: z.number(),
})

export enum SEO_METIER_FORMATION_NIVEAUX {
  "3 (CAP...)" = "3 (CAP...)",
  "4 (BAC...)" = "4 (BAC...)",
  "5 (BTS, DEUST...)" = "5 (BTS, DEUST...)",
  "6 (Licence, BUT...)" = "6 (Licence, BUT...)",
  "7 (Master, titre ingénieur...)" = "7 (Master, titre ingénieur...)",
}

const ZFormationsNiveaux = extensions.buildEnum(SEO_METIER_FORMATION_NIVEAUX)

export enum SEO_METIER_FORMATION_TITRES {
  "3 (CAP...)" = "CAP, BEP, ...",
  "4 (BAC...)" = "Baccalauréat",
  "5 (BTS, DEUST...)" = "BTS, ...",
  "6 (Licence, BUT...)" = "Licence, 1ère année de Master, BUT, ...",
  "7 (Master, titre ingénieur...)" = "Master, diplôme d'école de commerce, diplôme d'école d'ingénieur, ...",
}

const ZFormationsTitres = extensions.buildEnum(SEO_METIER_FORMATION_TITRES)

export enum SEO_METIER_FORMATION_DESCRIPTIONS {
  "3 (CAP...)" = "ou autres formations niveau infrabac",
  "4 (BAC...)" = "ou autres formations niveau Bac",
  "5 (BTS, DEUST...)" = "ou autres formations niveau Bac+2",
  "6 (Licence, BUT...)" = "ou autres formations niveau Bac+3",
  "7 (Master, titre ingénieur...)" = "ou autres formations niveau Bac+5",
}

const ZFormationsDescriptions = extensions.buildEnum(SEO_METIER_FORMATION_DESCRIPTIONS)

const ZSeoMetierFormation = z.object({
  title: ZFormationsTitres,
  description: ZFormationsDescriptions,
  niveau: ZFormationsNiveaux,
  count: z.number(),
})

const ZSeoMetierVille = z.object({
  nom: z.string(),
  job_count: z.number(),
  geopoint: z.object({ lat: z.number(), long: z.number() }),
})

const ZSeoMetierCard = z.object({
  title: z.string(),
  partner_label: ZJobsPartnersOfferPrivate.shape.partner_label,
  offer_title: z.string().nullable(),
  workplace_naf_label: z.string().nullable(),
  workplace_name: z.string().nullable(),
  application_count: z.number(),
  partner_job_id: z.string(),
  workplace_address_city: z.string(),
  workplace_address_zipcode: z.string(),
})

export const ZSeoMetier = z
  .object({
    _id: zObjectId,
    metier: z.string(),
    slug: z.string(),
    description: z.string(),
    job_count: z.number(),
    company_count: z.number(),
    applicant_count: z.number(),
    missions: z.array(ZSeoMetierMission),
    competences: z.array(ZSeoMetierCompetence),
    salaire: ZSeoMetierSalaire,
    entreprises: z.array(ZSeoMetierEntreprise),
    formations: z.array(ZSeoMetierFormation),
    villes: z.array(ZSeoMetierVille),
    romes: z.array(z.string()),
    cards: z.array(ZSeoMetierCard),
    created_at: z.date(),
    updated_at: z.date(),
  })
  .strict()

export type ISeoMetier = z.output<typeof ZSeoMetier>

export default {
  zod: ZSeoMetier,
  indexes: [[{ slug: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
