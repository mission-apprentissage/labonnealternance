import { permanentRedirect } from "next/navigation"
import { PAGES } from "@/utils/routes.utils"

const OrganismeDeFormation = () => {
  permanentRedirect(PAGES.static.jeSuisCFA.getPath())
}

export default OrganismeDeFormation
