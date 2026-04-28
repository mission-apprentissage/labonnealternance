import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "seo_diplomes" as const

const ZSeoDiplomeKpis = z.object({
  duration: z.string(),
  entreprise: z.string(),
  salaire: z.string(),
  insertion: z.string(),
})

const ZSeoDiplomeProgrammeSections = z.object({
  enseignements_generaux: z.array(z.string()),
  enseignements_professionnels: z.array(z.string()),
  competences_developpees: z.array(z.string()),
})

const ZSeoDiplomeEntreprise = z.object({
  name: z.string(),
  postes: z.number(),
})

const ZSeoDiplomeFormation = z.object({
  title: z.string(),
  formations: z.number(),
  duree: z.string(),
  niveau: z.string(),
  specialisation: z.string(),
  competences: z.string(),
})

const ZSeoDiplomeVille = z.object({
  name: z.string(),
  offres: z.number(),
  href: z.string(),
})

const ZSeoDiplomePerspectiveKpi = z.object({
  icon: z.string(),
  value: z.string(),
  label: z.string(),
})

const ZSeoDiplomeCarriere = z.object({
  periode: z.string(),
  titre: z.string(),
  salaire: z.string(),
  missions: z.string(),
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

const ZSeoDiplomeAutre = z.object({
  icon: z.string(),
  title: z.string(),
  sousTitre: z.string().optional(),
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
    entreprises: z.object({
      title: z.string(),
      text: z.string(),
      liste: z.array(ZSeoDiplomeEntreprise),
    }),
    formations: z.object({
      title: z.string(),
      niveaux: z.array(ZSeoDiplomeFormation),
    }),
    localisation: z.object({
      title: z.string(),
      text: z.string(),
      villes: z.array(ZSeoDiplomeVille),
    }),
    perspectives: z.object({
      title: z.string(),
      kpis: z.array(ZSeoDiplomePerspectiveKpi),
      carrieres: z.array(ZSeoDiplomeCarriere),
    }),
    ecoles: z.array(ZSeoDiplomeEcoleCard),
    salaire: z.array(ZSeoDiplomeSalaireLigne),
    metiers: z.object({
      title: z.string(),
      text: z.string(),
      liste: z.array(ZSeoDiplomeMetier),
    }),
    autresDiplomes: z.array(ZSeoDiplomeAutre),
    created_at: z.date(),
    updated_at: z.date(),
  })
  .strict()

export type ISeoDiplome = z.output<typeof ZSeoDiplome>

export default {
  zod: ZSeoDiplome,
  indexes: [[{ slug: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
