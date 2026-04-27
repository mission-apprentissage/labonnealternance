import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "seo_diplomes" as const

const ZSeoDiplomeKpi = z.object({
  label: z.string(),
  value: z.string(),
  iconSrc: z.string(),
  labelFirst: z.boolean().optional(),
})

const ZSeoDiplomeObjectif = z.object({
  iconSrc: z.string(),
  title: z.string(),
  items: z.array(z.string()),
})

const ZSeoDiplomeProgramme = z.object({
  icon: z.string(),
  title: z.string(),
  items: z.array(z.string()),
})

const ZSeoDiplomePrerequis = z.object({
  label: z.string(),
})

const ZSeoDiplomeEtape = z.object({
  numero: z.number(),
  title: z.string(),
  description: z.string(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
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
    kpis: z.array(ZSeoDiplomeKpi),
    description: z.object({
      text: z.string(),
      objectifs: z.array(ZSeoDiplomeObjectif),
    }),
    programme: z.object({
      text: z.string(),
      sections: z.array(ZSeoDiplomeProgramme),
    }),
    integration: z.object({
      title: z.string(),
      prerequis: z.array(ZSeoDiplomePrerequis),
      etapes: z.array(ZSeoDiplomeEtape),
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
    ecoles: z.object({
      title: z.string(),
      titleHighlight: z.string().optional(),
      formations: z.array(ZSeoDiplomeEcoleCard),
    }),
    salaire: z.object({
      title: z.string(),
      titleHighlight: z.string().optional(),
      titleSuffix: z.string().optional(),
      texteIntro: z.string(),
      lignes: z.array(ZSeoDiplomeSalaireLigne),
    }),
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
