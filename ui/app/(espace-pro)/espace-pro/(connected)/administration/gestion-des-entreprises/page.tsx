import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import GestionEntreprises from "./gestionEntreprises"
export const metadata: Metadata = {
  title: METADATA.static.backAdminGestionDesEntreprises().title,
}

export default async function AdministrationGestionEntreprises() {
  return <GestionEntreprises />
}
