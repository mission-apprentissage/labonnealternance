import CreationOffre from "@/app/(espace-pro)/espace-pro/(connected)/entreprise/creation-offre/page"
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"

import { Layout } from "../../../../../../../../components/espace_pro"
import { authProvider, withAuth } from "../../../../../../../../components/espace_pro/withAuth"

function OpcoEntrepriseCreationOffre() {
  return (
    <Layout footer={false}>
      <CreationOffre />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(OpcoEntrepriseCreationOffre))
