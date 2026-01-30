import type { Metadata } from "next"
import { DepotRapideFin } from "@/app/(espace-pro)/_components/DepotRapideFin"

export const metadata: Metadata = {
  title: "Fin de création d'offre - La bonne alternance",
}

function Page() {
  return <DepotRapideFin />
}

export default Page
