import { Layout } from "../../../../../../../components/espace_pro"
import ListeOffres from "../../../../../../../components/espace_pro/ListeOffres"
import withAuth from "../../../../../../../components/espace_pro/withAuth"

function OpcoEntrepriseListOffre() {
  return (
    <Layout footer={false}>
      <ListeOffres />
    </Layout>
  )
}
export default withAuth(OpcoEntrepriseListOffre)
