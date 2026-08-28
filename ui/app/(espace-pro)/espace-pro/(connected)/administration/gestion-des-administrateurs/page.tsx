import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import GestionDesAdministrateurs from "./gestionDesAdministrateurs"
export const metadata: Metadata = {
  title: METADATA.static.backAdminGestionDesAdministrateurs().title,
}

export default async function AdministrationGestionAdministrateurs() {
  return <GestionDesAdministrateurs />
}
