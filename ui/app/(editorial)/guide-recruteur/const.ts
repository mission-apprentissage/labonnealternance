import { PAGES } from "@/utils/routes.utils"

export const IMAGE_BASE_PATH = "/images/guides/guide-recruteur/"

export const ARTICLES: Record<string, { id: string; title: string; description: string; imageUrl?: string; path: string; updatedAt: string }> = {
  ["je-suis-employeur-public"]: {
    id: "je-suis-employeur-public",
    title: PAGES.static.guideRecruteurJeSuisEmployeurPublic.title,
    description: PAGES.static.guideRecruteurJeSuisEmployeurPublic.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}je-suis-employeur-public.svg`,
    path: PAGES.static.guideRecruteurJeSuisEmployeurPublic.getPath(),
    updatedAt: "26/03/2026",
  },
  ["cerfa-apprentissage-et-professionnalisation"]: {
    id: "cerfa-apprentissage-et-professionnalisation",
    title: PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.title,
    description: PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}cerfa-apprentissage-et-professionnalisation.svg`,
    path: PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.getPath(),
    updatedAt: "26/03/2026",
  },
}
