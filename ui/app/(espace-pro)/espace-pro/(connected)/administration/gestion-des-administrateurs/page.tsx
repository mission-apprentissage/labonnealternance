import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import GestionDesAdministrateurs from "./gestionDesAdministrateurs"

export const metadata: Metadata = {
  title: PAGES.static.backAdminGestionDesAdministrateurs.getMetadata().title,
}

export default async function AdministrationGestionAdministrateurs() {
  return <GestionDesAdministrateurs />
}
