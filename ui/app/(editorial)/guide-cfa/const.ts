import { PAGES } from "@/utils/routes.utils"

export const IMAGE_BASE_PATH = "/images/guides/guide-cfa/"

export const ARTICLES: Record<string, { id: string; title: string; description: string; imageUrl?: string; path: string; updatedAt: string }> = {
  ["la-carte-etudiant-des-metiers"]: {
    id: "la-carte-etudiant-des-metiers",
    title: PAGES.static.guideCfaLaCarteEtudiantDesMetiers.title,
    description: PAGES.static.guideCfaLaCarteEtudiantDesMetiers.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}la-carte-etudiant-des-metiers.svg`,
    path: PAGES.static.guideCfaLaCarteEtudiantDesMetiers.getPath(),
    updatedAt: "26/03/2026",
  },
  ["accompagner-vos-alternants"]: {
    id: "accompagner-vos-alternants",
    title: PAGES.static.guideCfaAccompagnerVosAlternants.title,
    description: PAGES.static.guideCfaAccompagnerVosAlternants.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}accompagner-vos-alternants.svg`,
    path: PAGES.static.guideCfaAccompagnerVosAlternants.getPath(),
    updatedAt: "20/07/2026",
  },
}
