import type { Metadata } from "next"
import GestionEntreprises from "./gestionEntreprises"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.backAdminGestionDesEntreprises.getMetadata().title,
}

export default async function AdministrationGestionEntreprises() {
  return <GestionEntreprises />
}
