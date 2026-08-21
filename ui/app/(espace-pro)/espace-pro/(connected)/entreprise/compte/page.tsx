import type { Metadata } from "next"
import { ENTREPRISE } from "shared/constants/recruteur"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CompteRenderer from "@/app/(espace-pro)/espace-pro/(connected)/_components/CompteRenderer"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
export const metadata: Metadata = {
  title: METADATA.dynamic.compte({ userType: ENTREPRISE }).title,
}

export default function Page() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backHomeEntreprise, PAGES.dynamic.compte({ userType: ENTREPRISE })]} />
      <CompteRenderer />
    </>
  )
}
