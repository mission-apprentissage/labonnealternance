import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"
import { RecruteursList } from "./RecruteursList"

export const metadata: Metadata = {
  title: PAGES.static.backAdminGestionDesRecruteurs.getMetadata().title,
}

export default async function GestionDesRecruteurs() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminGestionDesRecruteurs]} />
      <RecruteursList />
    </>
  )
}
