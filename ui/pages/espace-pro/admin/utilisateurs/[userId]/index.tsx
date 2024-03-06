import { useRouter } from "next/router"
import { useQuery } from "react-query"
import { IUserRecruteurJson } from "shared"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { Layout, LoadingEmptySpace } from "@/components/espace_pro"
import UserView from "@/components/espace_pro/Admin/utilisateurs/UserView"
import { authProvider, withAuth } from "@/components/espace_pro/withAuth"
import { apiGet } from "@/utils/api.utils"

const AdminUserView = ({ userId }: { userId: string }) => {
  const {
    data: user,
    isLoading,
    refetch: refetchUser,
  } = useQuery<IUserRecruteurJson>({
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

  return <UserView user={user} refetchUser={refetchUser} />
}

function AdminUserViewPage() {
  const router = useRouter()
  const { userId } = router.query as { userId: string }

  return (
    <Layout footer={false}>
      <AdminUserView userId={userId} />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(AdminUserViewPage, "adminLbaR"))
