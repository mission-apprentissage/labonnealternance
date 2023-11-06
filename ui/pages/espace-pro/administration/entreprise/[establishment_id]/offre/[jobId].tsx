import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"

import { Layout } from "../../../../../../components/espace_pro"
import CreationOffre from "../../../../../../components/espace_pro/CreationOffre"
import { authProvider, withAuth } from "../../../../../../components/espace_pro/withAuth"

function EntrepriseCreationOffrePage() {
  return (
    <Layout footer={false}>
      <CreationOffre />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(EntrepriseCreationOffrePage))
