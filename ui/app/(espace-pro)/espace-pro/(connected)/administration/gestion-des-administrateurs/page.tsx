import type { Metadata } from "next"
import GestionDesAdministrateurs from "./gestionDesAdministrateurs"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.backAdminGestionDesAdministrateurs.getMetadata().title,
}

export default async function AdministrationGestionAdministrateurs() {
  return <GestionDesAdministrateurs />
}
