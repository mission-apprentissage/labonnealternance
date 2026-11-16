import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"
import { ZFormationsNiveaux, ZSeoJobCard, ZSeoMetierEntreprise, ZSeoMetierFormation, ZSeoMetierVille } from "./seo-metier.model.js"

const collectionName = "seo_secteurs" as const

const ZSeoSecteurMetier = z.object({
  libelle: z.string(),
  romes: z.array(z.string()),
  description: z.string(),
  niveau_acces: z.string(),
  metier_slug: z.string().nullable(),
})

const ZSeoSecteurMarche = z.object({
  projets_recrutement: z.number(),
  part_difficiles: z.number(),
  annee: z.number(),
  source_libelle: z.string(),
  source_url: z.string(),
  interpretation: z.string(),
})

const ZSeoSecteurFormationNiveau = z.object({
  niveau: ZFormationsNiveaux,
  diplomes: z.string(),
  diplome_slug: z.string().nullable(),
})

const ZSeoSecteurFaq = z.object({
  question: z.string(),
  reponse: z.string(),
})

const ZSeoSecteurMetierCount = z.object({
  libelle: z.string(),
  job_count: z.number(),
})

// Champs calculés optionnels : la migration crée le document avant le premier passage du calcul.
export const ZSeoSecteur = z.strictObject({
  _id: zObjectId,
  slug: z.string(),
  secteur: z.string(),
  titre: z.string(),
  accroche: z.string(),
  meta_description: z.string(),
  q_recherche: z.string(),
  description: z.array(z.string()),
  metiers: z.array(ZSeoSecteurMetier),
  marche: ZSeoSecteurMarche.nullable(),
  formations_niveaux: z.array(ZSeoSecteurFormationNiveau),
  faq: z.array(ZSeoSecteurFaq),
  romes: z.array(z.string()),
  job_count: z.number().optional(),
  company_count: z.number().optional(),
  algo_company_count: z.number().optional(),
  applicant_count: z.number().optional(),
  metiers_counts: z.array(ZSeoSecteurMetierCount).optional(),
  entreprises: z.array(ZSeoMetierEntreprise).optional(),
  villes: z.array(ZSeoMetierVille).optional(),
  formations: z.array(ZSeoMetierFormation).optional(),
  cards: z.array(ZSeoJobCard).optional(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type ISeoSecteur = z.output<typeof ZSeoSecteur>
export type ISeoSecteurMetier = z.output<typeof ZSeoSecteurMetier>

export default {
  zod: ZSeoSecteur,
  indexes: [[{ slug: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
