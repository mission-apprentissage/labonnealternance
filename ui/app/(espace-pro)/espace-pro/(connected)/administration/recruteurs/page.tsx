import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"
import { RecruteursList } from "./RecruteursList"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

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
