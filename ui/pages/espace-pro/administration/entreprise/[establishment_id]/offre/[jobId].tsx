import { Layout } from "../../../../../../components/espace_pro"
import CreationOffre from "../../../../../../components/espace_pro/CreationOffre"
import withAuth from "../../../../../../components/espace_pro/withAuth"

function EntrepriseCreationOffre() {
  return <CreationOffre />
}

function EntrepriseCreationOffrePage() {
  return (
    <Layout footer={false}>
      <EntrepriseCreationOffre />
    </Layout>
  )
}
export default withAuth(EntrepriseCreationOffrePage)
