import { PAGES } from "@/utils/routes.utils"

export const IMAGE_BASE_PATH = "/images/guides/guide-recruteur/"

export const ARTICLES: Record<string, { id: string; title: string; description: string; imageUrl: string; path: string; updatedAt: string }> = {
  ["decouvrir-l-alternance"]: {
    id: "decouvrir-l-alternance",
    title: PAGES.static.guideAlternantDecouvrirLAlternance.title,
    description: PAGES.static.guideAlternantDecouvrirLAlternance.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}decouvrir-l-alternance.svg`,
    path: PAGES.static.guideAlternantDecouvrirLAlternance.getPath(),
    updatedAt: "30/01/2026",
  },
  ["apprentissage-et-handicap"]: {
    id: "apprentissage-et-handicap",
    title: PAGES.static.guideAlternantApprentissageEtHandicap.title,
    description: PAGES.static.guideAlternantApprentissageEtHandicap.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}apprentissage-et-handicap.svg`,
    path: PAGES.static.guideAlternantApprentissageEtHandicap.getPath(),
    updatedAt: "30/01/2026",
  },
  ["je-suis-employeur-public"]: {
    id: "je-suis-employeur-public",
    title: PAGES.static.guideRecruteurJeSuisEmployeurPublic.title,
    description: PAGES.static.guideRecruteurJeSuisEmployeurPublic.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}je-suis-employeur-public.svg`,
    path: PAGES.static.guideRecruteurJeSuisEmployeurPublic.getPath(),
    updatedAt: "30/01/2026",
  },
  ["cerfa-apprentissage-et-professionnalisation"]: {
    id: "cerfa-apprentissage-et-professionnalisation",
    title: PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.title,
    description: PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}cerfa-apprentissage-et-professionnalisation.svg`,
    path: PAGES.static.guideRecruteurCerfaApprentissageEtProfessionnalisation.getPath(),
    updatedAt: "30/01/2026",
  },
  ["aides-a-l-embauche-en-alternance"]: {
    id: "aides-a-l-embauche-en-alternance",
    title: PAGES.static.guideRecruteurAidesALEmbaucheEnAlternance.title,
    description: PAGES.static.guideRecruteurAidesALEmbaucheEnAlternance.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}aides-a-l-embauche-en-alternance.svg`,
    path: PAGES.static.guideRecruteurAidesALEmbaucheEnAlternance.getPath(),
    updatedAt: "30/01/2026",
  },
  ["prevention-des-risques-professionnels-pour-les-apprentis"]: {
    id: "prevention-des-risques-professionnels-pour-les-apprentis",
    title: PAGES.static.guideRecruteurPreventionDesRisquesProfessionnelsPourLesApprentis.title,
    description: PAGES.static.guideRecruteurPreventionDesRisquesProfessionnelsPourLesApprentis.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}prevention-des-risques-professionnels-pour-les-apprentis.svg`,
    path: PAGES.static.guideRecruteurPreventionDesRisquesProfessionnelsPourLesApprentis.getPath(),
    updatedAt: "30/01/2026",
  },
}
