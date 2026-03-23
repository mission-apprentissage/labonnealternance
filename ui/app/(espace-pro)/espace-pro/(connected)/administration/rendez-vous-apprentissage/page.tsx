import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import RendezVousApprentissagePage from "./RendezVousApprentissagePage"

export const metadata: Metadata = {
  title: PAGES.static.rendezVousApprentissageRecherche.getMetadata().title,
}

export default async function Page() {
  return <RendezVousApprentissagePage />
}
