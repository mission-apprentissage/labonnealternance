import { Layout } from "../../../../../../../../components/espace_pro"
import CreationOffre from "../../../../../../../../components/espace_pro/CreationOffre"
import withAuth from "../../../../../../../../components/espace_pro/withAuth"

function OpcoEntrepriseCreationOffre() {
  return (
    <Layout footer={false}>
      <CreationOffre />
    </Layout>
  )
}
export default withAuth(OpcoEntrepriseCreationOffre)
