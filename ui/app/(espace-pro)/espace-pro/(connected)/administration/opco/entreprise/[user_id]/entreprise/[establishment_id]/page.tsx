import ListeOffres from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/ListeOffres"

//TODO doit contenir la liste des offres de la société administré par l'opco sélectionnée

export default async function EntrepriseJobList() {
  return <ListeOffres hideModify={true} />
}
