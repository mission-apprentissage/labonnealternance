import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"

import { Layout } from "../../../../../../../components/espace_pro"
import ListeOffres from "../../../../../../../components/espace_pro/ListeOffres"
import { authProvider, withAuth } from "../../../../../../../components/espace_pro/withAuth"

function OpcoEntrepriseListOffre() {
  return (
    <Layout footer={false}>
      <ListeOffres hideModify={true} />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(OpcoEntrepriseListOffre))
