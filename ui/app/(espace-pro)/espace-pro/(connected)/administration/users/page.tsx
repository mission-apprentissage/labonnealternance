import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"
import { UsersList } from "./UsersList"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: PAGES.static.backAdminHome.getMetadata().title,
}

export default async function AccueilAdministration() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome]} />
      <UsersList />
    </>
  )
}
