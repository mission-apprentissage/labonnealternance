import { CFA } from "shared/constants/recruteur"

import CompteRenderer from "@/app/(espace-pro)/espace-pro/(connected)/_components/CompteRenderer"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function Page() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backCfaHome, PAGES.dynamic.compte({ userType: CFA })]} />
      <CompteRenderer />
    </>
  )
}
