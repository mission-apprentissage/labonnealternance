import type { Metadata } from "next"
import RendezVousApprentissagePage from "./RendezVousApprentissagePage"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.rendezVousApprentissageRecherche.getMetadata().title,
}

export default async function Page() {
  return <RendezVousApprentissagePage />
}
