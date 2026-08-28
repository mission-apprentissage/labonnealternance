import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import RendezVousApprentissagePage from "./RendezVousApprentissagePage"
export const metadata: Metadata = {
  title: METADATA.static.rendezVousApprentissageRecherche().title,
}

export default async function Page() {
  return <RendezVousApprentissagePage />
}
