import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
import { UsersList } from "./UsersList"
export const metadata: Metadata = {
  title: METADATA.static.backAdminHome().title,
}

export default async function AccueilAdministration() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome]} />
      <UsersList />
    </>
  )
}
