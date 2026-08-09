import type { Metadata } from "next"
import { DepotSimplifieCreationOffre } from "@/app/(espace-pro-creation-compte)/_components/DepotSimplifieCreationOffre"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: "Formulaire de dépôt d'offre - Informations de l'offre - La bonne alternance",
}

export default function Page() {
  return <DepotSimplifieCreationOffre />
}
