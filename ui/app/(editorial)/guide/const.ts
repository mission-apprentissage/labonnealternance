import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

export const IMAGE_BASE_PATH = "/images/guides/"

export const ARTICLES: Record<string, { id: string; title: string; description: string; imageUrl?: string; path: string; updatedAt: string }> = {
  ["decouvrir-l-alternance"]: {
    id: "decouvrir-l-alternance",
    title: PAGES.static.guideDecouvrirLAlternance.title,
    description: METADATA.static.guideDecouvrirLAlternance().description,
    imageUrl: `${IMAGE_BASE_PATH}decouvrir-l-alternance.svg`,
    path: PAGES.static.guideDecouvrirLAlternance.getPath(),
    updatedAt: "26/03/2026",
  },
  ["apprentissage-et-handicap"]: {
    id: "apprentissage-et-handicap",
    title: PAGES.static.guideApprentissageEtHandicap.title,
    description: METADATA.static.guideApprentissageEtHandicap().description,
    imageUrl: `${IMAGE_BASE_PATH}apprentissage-et-handicap.svg`,
    path: PAGES.static.guideApprentissageEtHandicap.getPath(),
    updatedAt: "01/04/2026",
  },
  ["prevention-des-risques-professionnels-pour-les-apprentis"]: {
    id: "prevention-des-risques-professionnels-pour-les-apprentis",
    title: PAGES.static.guidePreventionDesRisquesProfessionnelsPourLesApprentis.title,
    description: METADATA.static.guidePreventionDesRisquesProfessionnelsPourLesApprentis().description,
    imageUrl: `${IMAGE_BASE_PATH}prevention-des-risques-professionnels-pour-les-apprentis.svg`,
    path: PAGES.static.guidePreventionDesRisquesProfessionnelsPourLesApprentis.getPath(),
    updatedAt: "26/03/2026",
  },
  // TODO: ajouter l'illustration dédiée (${IMAGE_BASE_PATH}rediger-son-offre-d-alternance.svg) une fois livrée par le design
  ["rediger-son-offre-d-alternance"]: {
    id: "rediger-son-offre-d-alternance",
    title: PAGES.static.guideRedigerSonOffreDAlternance.title,
    description: PAGES.static.guideRedigerSonOffreDAlternance.getMetadata().description,
    path: PAGES.static.guideRedigerSonOffreDAlternance.getPath(),
    updatedAt: "03/08/2026",
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
