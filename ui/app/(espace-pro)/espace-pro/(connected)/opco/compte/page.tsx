import type { Metadata } from "next"
import { OPCO } from "shared/constants/recruteur"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CompteRenderer from "@/app/(espace-pro)/espace-pro/(connected)/_components/CompteRenderer"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
export const metadata: Metadata = {
  title: METADATA.dynamic.compte({ userType: OPCO }).title,
}

export default function Page() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backOpcoHome, PAGES.dynamic.compte({ userType: OPCO })]} />
      <CompteRenderer />
    </>
  )
}
