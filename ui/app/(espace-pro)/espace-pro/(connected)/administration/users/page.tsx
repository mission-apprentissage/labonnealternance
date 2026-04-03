import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"
import { PAGES } from "@/utils/routes.utils"
import { UsersList } from "./UsersList"

export const metadata: Metadata = {
  title: PAGES.static.backAdminHome.getMetadata().title,
}

export default async function AccueilAdministration() {
  return (
    <AdminLayout>
      <Breadcrumb pages={[PAGES.static.backAdminHome]} />
      <UsersList />
    </AdminLayout>
  )
}
