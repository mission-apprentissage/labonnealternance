import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"
import { OffresPartenairesList } from "./OffresPartenairesList"
export const metadata: Metadata = {
  title: PAGES.static.backAdminGestionDesOffresPartenaires.getMetadata().title,
}

export default async function GestionDesOffresPartenaires() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminGestionDesOffresPartenaires]} />
      <OffresPartenairesList />
    </>
  )
}
