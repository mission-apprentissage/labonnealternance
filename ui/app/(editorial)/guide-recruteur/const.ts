import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

export const IMAGE_BASE_PATH = "/images/guides/guide-recruteur/"

export const ARTICLES: Record<string, { id: string; title: string; description: string; imageUrl?: string; path: string; updatedAt: string }> = {
  ["recruter-un-alternant"]: {
    id: "recruter-un-alternant",
    title: PAGES.static.guideRecruteurRecruterUnAlternant.title,
    description: METADATA.static.guideRecruteurRecruterUnAlternant().description,
    imageUrl: `${IMAGE_BASE_PATH}aides-a-l-embauche-en-alternance.svg`,
    path: PAGES.static.guideRecruteurRecruterUnAlternant.getPath(),
    updatedAt: "11/08/2026",
  },
  ["je-suis-employeur-public"]: {
    id: "je-suis-employeur-public",
    title: PAGES.static.guideRecruteurJeSuisEmployeurPublic.title,
    description: METADATA.static.guideRecruteurJeSuisEmployeurPublic().description,
    imageUrl: `${IMAGE_BASE_PATH}je-suis-employeur-public.svg`,
    path: PAGES.static.guideRecruteurJeSuisEmployeurPublic.getPath(),
    updatedAt: "26/03/2026",
  },
  ["cerfa-apprentissage-et-professionnalisation"]: {
    id: "cerfa-apprentissage-et-professionnalisation",
    title: PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.title,
    description: METADATA.static.guideRecruteurCerfaApprentissageEtProfessionnalisation().description,
    imageUrl: `${IMAGE_BASE_PATH}cerfa-apprentissage-et-professionnalisation.svg`,
    path: PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.getPath(),
    updatedAt: "26/03/2026",
  },
}
