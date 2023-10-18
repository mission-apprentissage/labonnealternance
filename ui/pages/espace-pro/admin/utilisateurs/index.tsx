import { Box, Heading } from "@chakra-ui/react"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { Layout } from "@/components/espace_pro"
import UserList from "@/components/espace_pro/Admin/utilisateurs/UserList"
import { Breadcrumb } from "@/components/espace_pro/common/components/Breadcrumb"
import { authProvider, withAuth } from "@/components/espace_pro/withAuth"

const AdminUsers = () => {
  const title = "Gestion des administrateurs"
  return (
    <Box mt={5}>
      <Breadcrumb pages={[{ title: "Administration", to: "/espace-pro/administration/users" }, { title: title }]} />
      <Heading as="h2" fontSize="2xl" mb={[3, 6]} mt={3}>
        {title}
      </Heading>
      <UserList />
    </Box>
  )
}

function AdminUsersPage() {
  return (
    <Layout footer={false}>
      <AdminUsers />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(AdminUsersPage, "adminLbaR"))
