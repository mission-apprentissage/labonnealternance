import { Layout } from "../../../../../components/espace_pro"
import ListeOffres from "../../../../../components/espace_pro/ListeOffres"
import withAuth from "../../../../../components/espace_pro/withAuth"

function EntrepriseListOffre() {
  return <ListeOffres />
}

function EntrepriseListOffrePage() {
  return (
    <Layout footer={false}>
      <EntrepriseListOffre />
    </Layout>
  )
}
export default withAuth(EntrepriseListOffrePage)
