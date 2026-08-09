import type { Metadata } from "next"
import CreationDetail from "./CreationDetailPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Formulaire de dépôt d'offre - Informations de compte - La bonne alternance",
}

const Page = async () => {
  return <CreationDetail />
}

export default Page
