import { permanentRedirect } from "next/navigation"
import { PAGES } from "@/utils/routes.utils"

const AccesRecruteur = () => {
  permanentRedirect(PAGES.static.jeSuisRecruteur.getPath())
}

export default AccesRecruteur
