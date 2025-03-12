import ListeOffres from "@/app/(espace-pro)/espace-pro/(connected)/_components/ListeOffres"
import { Layout } from "@/components/espace_pro"

//TODO doit contenir la liste des offres de la société administré par l'opco sélectionnée

export default async function EntrepriseJobList() {
  return (
    <Layout footer={false}>
      <ListeOffres hideModify={true} />
    </Layout>
  )
}
