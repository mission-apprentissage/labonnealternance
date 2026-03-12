import { PAGES } from "@/utils/routes.utils"

export const IMAGE_BASE_PATH = "/images/guides/guide-cfa/"

export const ARTICLES: Record<string, { id: string; title: string; description: string; imageUrl?: string; path: string; updatedAt: string }> = {
  ["la-carte-etudiant-des-metiers"]: {
    id: "la-carte-etudiant-des-metiers",
    title: PAGES.static.guideCfaLaCarteEtudiantDesMetiers.title,
    description: PAGES.static.guideCfaLaCarteEtudiantDesMetiers.getMetadata().description,
    imageUrl: `${IMAGE_BASE_PATH}la-carte-etudiant-des-metiers.svg`,
    path: PAGES.static.guideCfaLaCarteEtudiantDesMetiers.getPath(),
    updatedAt: "30/01/2026",
  },
}
