"use client"
import { Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { AdminUserForm } from "@/app/(espace-pro)/espace-pro/(connected)/administration/gestion-des-administrateurs/_components/AdminUserForm"
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

export default function EditAdministrateur({ userId }: { userId: string }) {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminGestionDesAdministrateurs, PAGES.dynamic.backEditAdministrator({ userId })]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {PAGES.dynamic.backEditAdministrator({ userId }).title}
      </Typography>
      <AdminUserView userId={userId} />
    </>
  )
}
