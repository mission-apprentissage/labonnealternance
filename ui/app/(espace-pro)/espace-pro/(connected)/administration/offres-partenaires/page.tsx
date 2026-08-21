import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
import { OffresPartenairesList } from "./OffresPartenairesList"
export const metadata: Metadata = {
  title: METADATA.static.backAdminGestionDesOffresPartenaires().title,
}

export default async function GestionDesOffresPartenaires() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminGestionDesOffresPartenaires]} />
      <OffresPartenairesList />
    </>
  )
}
