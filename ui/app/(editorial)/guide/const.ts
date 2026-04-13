import { PAGES } from "@/utils/routes.utils"

export const IMAGE_BASE_PATH = "/images/guides/"

export const ARTICLES: Record<string, { id: string; title: string; description: string; imageUrl?: string; path: string; updatedAt: string }> = {
  ["decouvrir-l-alternance"]: {
    id: "decouvrir-l-alternance",
    title: PAGES.static.guideDecouvrirLAlternance.title,
    description: PAGES.static.guideDecouvrirLAlternance.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}decouvrir-l-alternance.svg`,
    path: PAGES.static.guideDecouvrirLAlternance.getPath(),
    updatedAt: "26/03/2026",
  },
  ["apprentissage-et-handicap"]: {
    id: "apprentissage-et-handicap",
    title: PAGES.static.guideApprentissageEtHandicap.title,
    description: PAGES.static.guideApprentissageEtHandicap.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}apprentissage-et-handicap.svg`,
    path: PAGES.static.guideApprentissageEtHandicap.getPath(),
    updatedAt: "01/04/2026",
  },
  ["prevention-des-risques-professionnels-pour-les-apprentis"]: {
    id: "prevention-des-risques-professionnels-pour-les-apprentis",
    title: PAGES.static.guidePreventionDesRisquesProfessionnelsPourLesApprentis.title,
    description: PAGES.static.guidePreventionDesRisquesProfessionnelsPourLesApprentis.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}prevention-des-risques-professionnels-pour-les-apprentis.svg`,
    path: PAGES.static.guidePreventionDesRisquesProfessionnelsPourLesApprentis.getPath(),
    updatedAt: "26/03/2026",
  },
  ["guide-alternant"]: {
    id: "guide-alternant",
    title: "Ressources alternant",
    description: "Pour bien mener vos démarches liées à l'alternance",
    path: PAGES.static.guideAlternant.getPath(),
    updatedAt: "26/03/2026",
  },
  ["guide-recruteur"]: {
    id: "guide-recruteur",
    title: "Ressources recruteur",
    description: "Pour bien recruter et bien accueillir vos alternants",
    path: PAGES.static.guideRecruteur.getPath(),
    updatedAt: "26/03/2026",
  },
  ["guide-cfa"]: {
    id: "guide-cfa",
    title: "Ressources organisme de formation",
    description: "Des ressources pour vous et vos alternants",
    path: PAGES.static.guideCfa.getPath(),
    updatedAt: "26/03/2026",
  },
}
