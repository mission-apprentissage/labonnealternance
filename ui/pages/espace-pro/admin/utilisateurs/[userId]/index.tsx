import { useRouter } from "next/router"
import { useQuery } from "react-query"
import { IUserRecruteur } from "shared"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { Layout, LoadingEmptySpace } from "@/components/espace_pro"
import UserView from "@/components/espace_pro/Admin/utilisateurs/UserView"
import { authProvider, withAuth } from "@/components/espace_pro/withAuth"
import { apiGet } from "@/utils/api.utils"

interface Props {
  params: { userId: string }
}

const AdminUserView = ({ params }: Props) => {
  const { data: user, isLoading } = useQuery<IUserRecruteur>({
    queryKey: ["adminusersview"],
    queryFn: async () => {
      const user = await apiGet("/admin/users/:userId", { params })

      return user
    },
  })

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  return <UserView user={user} />
}

function AdminUserViewPage() {
  const router = useRouter()
  const { userId } = router.query as { userId: string }

  return (
    <Layout footer={false}>
      <AdminUserView params={{ userId }} />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(AdminUserViewPage, "adminLbaR"))
