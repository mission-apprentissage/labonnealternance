import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/router"

import { AdminUserForm } from "@/app/(espace-pro)/espace-pro/(connected)/administration/gestion-des-administrateurs/_components/AdminUserForm"
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { Layout, LoadingEmptySpace } from "@/components/espace_pro"
import { authProvider, withAuth } from "@/components/espace_pro/withAuth"
import { apiGet } from "@/utils/api.utils"

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

  return <AdminUserForm user={user} role={user.role} onUpdate={refetchUser} onDelete={() => router.push("/espace-pro/admin/utilisateurs")} />
}

function AdminUserViewPage() {
  const router = useRouter()
  const { userId } = router.query as { userId: string }

  return (
    <Layout displayNavigationMenu={false} footer={false}>
      <AdminUserView userId={userId} />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(AdminUserViewPage, "admin"))
