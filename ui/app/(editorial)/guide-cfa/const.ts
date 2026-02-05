import { PAGES } from "@/utils/routes.utils"

export const IMAGE_BASE_PATH = "/images/guides/guide-cfa/"

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
  ["la-carte-etudiant-des-metiers"]: {
    id: "la-carte-etudiant-des-metiers",
    title: PAGES.static.guideCFALaCarteEtudiantDesMetiers.title,
    description: PAGES.static.guideCFALaCarteEtudiantDesMetiers.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}la-carte-etudiant-des-metiers.svg`,
    path: PAGES.static.guideCFALaCarteEtudiantDesMetiers.getPath(),
    updatedAt: "30/01/2026",
  },
}
