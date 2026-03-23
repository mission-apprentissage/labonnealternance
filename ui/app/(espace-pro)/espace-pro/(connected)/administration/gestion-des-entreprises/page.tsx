import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import GestionEntreprises from "./gestionEntreprises"

export const metadata: Metadata = {
  title: PAGES.static.backAdminGestionDesEntreprises.getMetadata().title,
}

export default async function AdministrationGestionEntreprises() {
  return <GestionEntreprises />
}
