import { MATOMO_EVENTS, pushMatomoEvent } from "@/utils/matomo-utils"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"

// Les ancres reprennent celles du prototype validé (#5791) : la communication aux OPCO peut déjà y renvoyer.
export const OPCO_GUIDE_SECTIONS = [
  { id: "guide-changements", title: "Les nouveautés" },
  { id: "guide-ecrans", title: "Vidéo de démonstration" },
  { id: "guide-comptes", title: "Comment vérifier un compte ?" },
  { id: "guide-lien", title: "Comptes recruteurs et offres" },
  { id: "guide-analyse", title: "La classification des offres" },
  { id: "guide-categories", title: "Catégories de signalement" },
  { id: "guide-faq", title: "Questions fréquentes" },
] as const

export type OpcoGuideSectionId = (typeof OPCO_GUIDE_SECTIONS)[number]["id"]

export const getOpcoGuideHref = (sectionId?: OpcoGuideSectionId) => `${MODERATION_PAGES.opcoGuide.getPath()}${sectionId ? `#${sectionId}` : ""}`

export const getOpcoGuideVideoPath = (blockId: string) => `${MODERATION_PAGES.opcoGuide.getPath()}/video/${blockId}`

export type OpcoGuideEntryPoint = "entreprises" | "offres_moderation"

// Seule une ancre connue part vers Matomo : le hash de l'URL est libre.
export const getOpcoGuideLandingSection = (hash: string): OpcoGuideSectionId | "non_renseigné" => OPCO_GUIDE_SECTIONS.find(({ id }) => `#${id}` === hash)?.id ?? "non_renseigné"

export const trackOpcoGuideLinkClicked = (entryPoint: OpcoGuideEntryPoint) => pushMatomoEvent({ event: MATOMO_EVENTS.OPCO_GUIDE_LINK_CLICKED, opco_guide_entry_point: entryPoint })
