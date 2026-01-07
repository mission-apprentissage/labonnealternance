import type { Metadata } from "next"
import { DepotSimplifieCreationOffre } from "@/app/(espace-pro-creation-compte)/_components/DepotSimplifieCreationOffre"

export const metadata: Metadata = {
  title: "Formulaire de dépôt d'offre - compte créé - La bonne alternance",
}

export default function Page() {
  return <DepotSimplifieCreationOffre />
}
