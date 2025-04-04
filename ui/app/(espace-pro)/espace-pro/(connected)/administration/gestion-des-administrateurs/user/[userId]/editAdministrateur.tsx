"use client"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"

import { AdminLayout } from "@/app/(espace-pro)/espace-pro/(connected)/_components/AdminLayout"
import { AdminUserForm } from "@/app/(espace-pro)/espace-pro/(connected)/administration/gestion-des-administrateurs/_components/AdminUserForm"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { EAdminPages } from "@/app/_components/Layout/NavigationAdmin"
import { LoadingEmptySpace } from "@/components/espace_pro"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

const AdminUserView = ({ userId }: { userId: string }) => {
  const router = useRouter()
  const {
    data: user,
    isLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["adminusersview"],
    queryFn: async () => {
      const user = await apiGet("/admin/users/:userId", { params: { userId } })
      return user
    },
    enabled: !!userId,
  })

  if (isLoading || !userId) {
    return <LoadingEmptySpace />
  }

  return <AdminUserForm user={user} role={user.role} onUpdate={refetchUser} onDelete={() => router.push(PAGES.static.backAdminGestionDesAdministrateurs.getPath())} />
}

export default function EditAdministrateur() {
  const { userId } = useParams() as { userId: string }

  return (
    <AdminLayout currentAdminPage={EAdminPages.GESTION_ADMINISTRATEURS}>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminGestionDesAdministrateurs, PAGES.dynamic.backEditAdministrator({ userId })]} />
      <AdminUserView userId={userId} />
    </AdminLayout>
  )
}
