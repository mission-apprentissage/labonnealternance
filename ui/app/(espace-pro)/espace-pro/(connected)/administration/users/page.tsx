import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"
import UserLists from "@/app/(espace-pro)/espace-pro/(connected)/administration/users/UserLists"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default async function AccueilAdministration() {
  return (
    <AdminLayout currentAdminPage="GESTION_RECRUTEURS">
      <Breadcrumb pages={[PAGES.static.backAdminHome]} />
      <UserLists />
    </AdminLayout>
  )
}
