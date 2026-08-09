import type { Metadata } from "next"
import { ADMIN } from "shared/constants/recruteur"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import CompteRenderer from "@/app/(espace-pro)/espace-pro/(connected)/_components/CompteRenderer"
import { PAGES } from "@/utils/routes.utils"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: PAGES.dynamic.compte({ userType: ADMIN }).getMetadata().title,
}

export default function Page() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.dynamic.compte({ userType: ADMIN })]} />
      <CompteRenderer />
    </>
  )
}
