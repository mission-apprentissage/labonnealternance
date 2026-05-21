import type { IUserRecruteurPublic } from "shared"
import { PAGES } from "@/utils/routes.utils"

export function getDepotCtaHref(user: IUserRecruteurPublic | null | undefined, domain: "CFA" | "ENTREPRISE") {
  switch (user?.type) {
    case "ENTREPRISE":
      return PAGES.static.backEntrepriseCreationOffre.getPath()
    case "CFA":
      return PAGES.static.backCfaHome.getPath()
    case "OPCO":
      return PAGES.static.backOpcoHome.getPath()
    default:
      return domain === "CFA" ? PAGES.static.espaceProCreationCfa.getPath() : PAGES.static.espaceProCreationEntreprise.getPath()
  }
}
