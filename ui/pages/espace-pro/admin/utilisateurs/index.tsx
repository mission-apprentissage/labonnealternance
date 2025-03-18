import { Box, Heading } from "@chakra-ui/react"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { Layout } from "@/components/espace_pro"
import AdminUserList from "@/components/espace_pro/Admin/utilisateurs/AdminUserList"
import { OldBreadcrumb } from "@/components/espace_pro/common/components/Breadcrumb"
import { authProvider, withAuth } from "@/components/espace_pro/withAuth"

function AdminUsersPage() {
  const title = "Gestion des administrateurs"
  return (
    <Layout displayNavigationMenu={false} footer={false}>
      <Box mt={5}>
        <OldBreadcrumb pages={[{ title: "Administration", to: "/espace-pro/administration/users" }, { title }]} />
        <Heading as="h2" fontSize="2xl" mb={[3, 6]} mt={3}>
          {title}
        </Heading>
        <AdminUserList />
      </Box>
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(AdminUsersPage, "admin"))
