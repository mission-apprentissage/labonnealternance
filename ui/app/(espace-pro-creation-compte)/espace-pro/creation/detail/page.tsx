import type { Metadata } from "next"
import CreationDetail from "./CreationDetailPage"

export const metadata: Metadata = {
  title: "Formulaire de dépôt d'offre - Informations de compte - La bonne alternance",
}

const Page = async () => {
  return <CreationDetail />
}

export default Page
